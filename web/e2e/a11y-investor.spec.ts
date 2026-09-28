import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomValidCnpj } from "./helpers/cnpj";
import { createBusiness, createProfileWithAuth } from "./helpers/db";

// T60 (RNF-07): auditoria WCAG 2.1 AA (contraste, rótulos, navegação
// por teclado) nas telas-chave do investidor, via axe-core. Falha se
// houver violação de impacto `critical` ou `serious` - `moderate`/
// `minor` são reportadas no console para acompanhamento, sem quebrar
// o gate (o MVP prioriza as violações que de fato bloqueiam um
// usuário de leitor de tela ou navegação por teclado).
const CRITICAL_IMPACTS = ["critical", "serious"];

async function expectNoCriticalViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const critical = results.violations.filter(
    (v) => v.impact && CRITICAL_IMPACTS.includes(v.impact)
  );

  if (critical.length > 0) {
    console.log(
      "Violações críticas/sérias:",
      JSON.stringify(
        critical.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })),
        null,
        2
      )
    );
  }
  const minor = results.violations.filter(
    (v) => !v.impact || !CRITICAL_IMPACTS.includes(v.impact)
  );
  if (minor.length > 0) {
    console.log(
      "Violações moderate/minor (não bloqueiam o gate):",
      minor.map((v) => `${v.id} (${v.impact ?? "sem impacto"})`).join(", ")
    );
  }

  expect(critical).toEqual([]);
}

test.describe("Auditoria de acessibilidade WCAG 2.1 AA - telas do investidor (T60, RNF-07)", () => {
  test("/", async ({ page }) => {
    await page.goto("/");
    await expectNoCriticalViolations(page);
  });

  test("/descobrir/resultados", async ({ page }) => {
    await page.goto("/descobrir/resultados");
    await expectNoCriticalViolations(page);
  });

  test("/negocios", async ({ page }) => {
    await page.goto("/negocios");
    await expectNoCriticalViolations(page);
  });

  test("/negocios/[slug]", async ({ page }) => {
    const ownerId = await createProfileWithAuth("a11y-negocio-owner", "produtor");
    const slug = `negocio-a11y-${Date.now()}`;
    await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio A11y ${Date.now()}`,
      status: "verificado",
      cidade_ibge: "Belém",
      uf: "PA",
      produtos: ["Castanha"],
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
      recebe_visitas: false,
    });

    await page.goto(`/negocios/${slug}`);
    await expectNoCriticalViolations(page);
  });
});
