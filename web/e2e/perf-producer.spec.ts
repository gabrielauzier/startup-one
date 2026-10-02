import { test, expect, chromium } from "@playwright/test";
import { playAudit } from "playwright-lighthouse";
import { loginAsProducer } from "./helpers/auth";
import { getUserIdByEmail, createBusiness } from "./helpers/db";
import { randomValidCnpj } from "./helpers/cnpj";

// T60 (RNF-02): LCP <= 2,5s (4G simulado) e JS inicial <= 200KB
// comprimido nas 5 telas do cadastro do produtor, via Lighthouse
// (config padrão de navegação simula "Slow 4G" + CPU throttling de um
// aparelho de gama média - o mesmo perfil que a PRD usa para RNF-02).
// Testado neste ambiente (sandbox headless sem GPU): funcionou de
// ponta a ponta (~5-8s por página), sem travar nem nunca terminar -
// a alternativa pragmática descrita na task (parsear o build do
// Next.js) não foi necessária.
const LCP_LIMIT_MS = 2500;
const JS_LIMIT_BYTES = 200 * 1024;
const CDP_PORT = 9222;

test.describe("Auditoria de desempenho - cadastro do produtor (T60, RNF-02)", () => {
  test("LCP <= 2,5s e JS inicial <= 200KB nas 5 partes do cadastro", async () => {
    test.setTimeout(180_000);

    const browser = await chromium.launch({
      args: [`--remote-debugging-port=${CDP_PORT}`],
    });
    const page = await browser.newPage();

    try {
      const email = await loginAsProducer(page, "perf-producer");
      const ownerId = await getUserIdByEmail(email);
      await createBusiness(ownerId, { cnpj: randomValidCnpj(), status: "rascunho" });

      const failures: string[] = [];

      for (let part = 1; part <= 5; part += 1) {
        const path = `/produtor/cadastro/${part}`;
        await page.goto(path, { waitUntil: "networkidle" });

        const result = await playAudit({
          page,
          port: CDP_PORT,
          thresholds: { performance: 0 },
          disableLogs: true,
          ignoreError: true,
        });

        const lcpMs = result.lhr.audits["largest-contentful-paint"]?.numericValue ?? Infinity;
        const resourceSummaryDetails = result.lhr.audits["resource-summary"]?.details as
          | { items?: { resourceType: string; transferSize: number }[] }
          | undefined;
        const scriptBytes =
          resourceSummaryDetails?.items?.find((item) => item.resourceType === "script")
            ?.transferSize ?? Infinity;

        console.log(
          `${path}: LCP=${Math.round(lcpMs)}ms (limite ${LCP_LIMIT_MS}ms), JS=${Math.round(
            scriptBytes / 1024
          )}KB (limite ${JS_LIMIT_BYTES / 1024}KB)`
        );

        if (lcpMs > LCP_LIMIT_MS) {
          failures.push(`${path}: LCP ${Math.round(lcpMs)}ms > ${LCP_LIMIT_MS}ms`);
        }
        if (scriptBytes > JS_LIMIT_BYTES) {
          failures.push(
            `${path}: JS ${Math.round(scriptBytes / 1024)}KB > ${JS_LIMIT_BYTES / 1024}KB`
          );
        }
      }

      expect(failures).toEqual([]);
    } finally {
      await browser.close();
    }
  });
});
