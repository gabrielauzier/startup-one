import { test, expect } from "@playwright/test";
import { loginAsProducer, loginAsVerifier } from "./helpers/auth";
import { createBusiness, createEvidence, getUserIdByEmail } from "./helpers/db";

test.describe("Tela de análise /verificacao/[id] (T27)", () => {
  test('"Aprovar" fica desabilitado com item do checklist não conferido (CA-18.1)', async ({
    page,
  }) => {
    const ownerEmail = await loginAsProducer(page, "verif-owner1");
    const ownerId = await getUserIdByEmail(ownerEmail);
    const businessId = await createBusiness(ownerId);
    await createEvidence(businessId, "terra");

    await loginAsVerifier(page, "verif1");
    await page.goto(`/verificacao/${businessId}`);

    const aprovar = page.getByTestId("botao-aprovar");
    await expect(aprovar).toBeDisabled();

    const items = [
      "cnpj_ativo",
      "documento_terra_legivel",
      "fotos_compativeis",
      "producao_coerente",
    ];
    for (const item of items) {
      await page.getByTestId(`checklist-${item}`).click();
    }
    // faltando 1 item - continua desabilitado
    await expect(aprovar).toBeDisabled();

    await page.getByTestId("checklist-praticas_plausiveis").click();
    // todos os 5 marcados - habilita
    await expect(aprovar).toBeEnabled();
  });

  test("sem documento da terra, só Pedir ajuste está disponível (CA-08.2)", async ({
    page,
  }) => {
    const ownerEmail = await loginAsProducer(page, "verif-owner2");
    const ownerId = await getUserIdByEmail(ownerEmail);
    const businessId = await createBusiness(ownerId);
    // nenhuma evidencia do grupo "terra" criada de proposito

    await loginAsVerifier(page, "verif2");
    await page.goto(`/verificacao/${businessId}`);

    await expect(page.getByTestId("aviso-sem-terra")).toBeVisible();
    await expect(page.getByTestId("botao-aprovar")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Reprovar" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Pedir ajuste" })).toBeVisible();
  });

  test('"Pedir ajuste"/"Reprovar" exigem motivo com 20+ caracteres', async ({ page }) => {
    const ownerEmail = await loginAsProducer(page, "verif-owner3");
    const ownerId = await getUserIdByEmail(ownerEmail);
    const businessId = await createBusiness(ownerId);
    await createEvidence(businessId, "terra");

    await loginAsVerifier(page, "verif3");
    await page.goto(`/verificacao/${businessId}`);

    await page.getByRole("button", { name: "Reprovar" }).click();
    const confirmar = page.getByTestId("confirmar-decisao");
    await expect(confirmar).toBeDisabled();

    await page.getByTestId("motivo").fill("curto demais");
    await expect(confirmar).toBeDisabled();

    await page
      .getByTestId("motivo")
      .fill("Motivo com mais de vinte caracteres para reprovar o negócio.");
    await expect(confirmar).toBeEnabled();
  });

  test("Pedir ajuste com motivo válido transiciona o negócio para ajuste_solicitado", async ({
    page,
  }) => {
    const ownerEmail = await loginAsProducer(page, "verif-owner4");
    const ownerId = await getUserIdByEmail(ownerEmail);
    const businessId = await createBusiness(ownerId);
    await createEvidence(businessId, "terra");

    await loginAsVerifier(page, "verif4");
    await page.goto(`/verificacao/${businessId}`);

    await page.getByRole("button", { name: "Pedir ajuste" }).click();
    await page
      .getByTestId("motivo")
      .fill("Faltou uma foto legível do documento da terra, favor reenviar.");
    await page.getByTestId("confirmar-decisao").click();

    await page.waitForURL("/verificacao");
  });
});
