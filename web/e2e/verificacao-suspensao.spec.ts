import { test, expect } from "@playwright/test";
import { loginAsProducer, loginAsVerifier } from "./helpers/auth";
import { createBusiness, getUserIdByEmail } from "./helpers/db";

const API_URL = "http://127.0.0.1:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

async function isPubliclyVisible(businessId: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/rest/v1/businesses?id=eq.${businessId}&select=id`, {
    headers: { apikey: ANON_KEY },
  });
  const rows = (await res.json()) as unknown[];
  return rows.length === 1;
}

test.describe("Suspensão/reativação de selo (T29)", () => {
  test("suspender tira o negócio da visibilidade pública e reativar devolve (RN-21, CA-13.2)", async ({
    page,
  }) => {
    const ownerEmail = await loginAsProducer(page, "susp-owner1");
    const ownerId = await getUserIdByEmail(ownerEmail);
    const businessId = await createBusiness(ownerId, { status: "verificado" });

    expect(await isPubliclyVisible(businessId)).toBe(true);

    await loginAsVerifier(page, "susp-verif1");
    await page.goto(`/verificacao/${businessId}`);

    await page
      .getByTestId("motivo-suspensao")
      .fill("Irregularidade encontrada na visita técnica de rotina.");
    await page.getByTestId("confirmar-suspensao").click();

    await expect(page.getByTestId("botao-reativar")).toBeVisible();
    expect(await isPubliclyVisible(businessId)).toBe(false);

    await page.getByTestId("botao-reativar").click();
    await expect(page.getByTestId("confirmar-suspensao")).toBeVisible();
    expect(await isPubliclyVisible(businessId)).toBe(true);
  });

  test("suspender exige motivo com 20+ caracteres", async ({ page }) => {
    const ownerEmail = await loginAsProducer(page, "susp-owner2");
    const ownerId = await getUserIdByEmail(ownerEmail);
    const businessId = await createBusiness(ownerId, { status: "verificado" });

    await loginAsVerifier(page, "susp-verif2");
    await page.goto(`/verificacao/${businessId}`);

    const confirmar = page.getByTestId("confirmar-suspensao");
    await expect(confirmar).toBeDisabled();

    await page.getByTestId("motivo-suspensao").fill("curto");
    await expect(confirmar).toBeDisabled();
  });

  test("histórico de decisões lista aprovação/suspensão/reativação", async ({ page }) => {
    const ownerEmail = await loginAsProducer(page, "susp-owner3");
    const ownerId = await getUserIdByEmail(ownerEmail);
    const businessId = await createBusiness(ownerId, { status: "verificado" });

    await loginAsVerifier(page, "susp-verif3");
    await page.goto(`/verificacao/${businessId}`);

    await page
      .getByTestId("motivo-suspensao")
      .fill("Motivo de suspensão com mais de vinte caracteres.");
    await page.getByTestId("confirmar-suspensao").click();
    await expect(page.getByTestId("botao-reativar")).toBeVisible();

    await page.getByTestId("botao-reativar").click();
    await expect(page.getByTestId("confirmar-suspensao")).toBeVisible();

    const historyItems = page.getByTestId("historico-item");
    await expect(historyItems).toHaveCount(2);
  });
});

// CA-21.1 (envio de interesse por link antigo de negocio suspenso e'
// bloqueado): nao testavel nesta fase - o modulo de interesse (M6,
// T45-49) ainda nao existe. SPEC_DEVIATION documentada em tasks.md;
// revisitar no T46.
