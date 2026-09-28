import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import { loginAsProducer, loginAsVerifier } from "./helpers/auth";
import { createBusiness, createEvidence, getUserIdByEmail, getBusinessByOwnerId } from "./helpers/db";

// T59 (RNF-12): fluxo de ponta a ponta da verificação - um negócio
// enviado pelo produtor (em_analise), o verificador assume a fila,
// confere o checklist completo, lança as 3 notas e aprova. Termina
// verificado e visível na vitrine pública (RN-13), fechando o laço
// entre M2/M3 (cadastro/verificação) e M4 (vitrine).
test.describe("Fluxo completo: verificação de um negócio (RNF-12)", () => {
  test("produtor envia -> verificador assume/analisa/aprova -> negócio verificado e público", async ({
    page,
    browser,
  }) => {
    // Etapa 1: produtor logado (RN-02) - o envio final até `em_analise`
    // já está coberto de ponta a ponta em flow-cadastro.spec.ts; aqui o
    // negócio nasce direto em `em_analise` (equivalente ao T24) para
    // este fluxo focar na etapa de verificação em si, com evidência da
    // terra (obrigatória para poder aprovar, CA-08.2).
    const producerEmail = await loginAsProducer(page, "flow-verif-owner");
    const ownerId = await getUserIdByEmail(producerEmail);
    const slug = `negocio-flow-verif-${Date.now()}`;
    const nome = `Negócio Fluxo Verificação ${Date.now()}`;
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome,
      status: "em_analise",
    });
    await createEvidence(businessId, "terra");

    // Etapa 2: verificador entra na fila e abre a análise do negócio.
    const verifierContext = await browser.newContext();
    const verifierPage = await verifierContext.newPage();
    await loginAsVerifier(verifierPage, "flow-verif");
    await verifierPage.goto("/verificacao");
    await expect(verifierPage.getByText(nome)).toBeVisible();

    await verifierPage.goto(`/verificacao/${businessId}`);
    await expect(verifierPage.getByTestId("botao-aprovar")).toBeDisabled();

    // Etapa 3: confere todo o checklist (RN-18/CA-18.1) - habilita Aprovar.
    const items = [
      "cnpj_ativo",
      "documento_terra_legivel",
      "fotos_compativeis",
      "producao_coerente",
      "praticas_plausiveis",
    ];
    for (const item of items) {
      await verifierPage.getByTestId(`checklist-${item}`).click();
    }
    await expect(verifierPage.getByTestId("botao-aprovar")).toBeEnabled();

    // Etapa 4: lança as notas A/S/G e confirma a aprovação (RN-19).
    await verifierPage.getByTestId("botao-aprovar").click();
    await verifierPage.locator('input[type="number"]').nth(0).fill("85");
    await verifierPage.locator('input[type="number"]').nth(1).fill("78");
    await verifierPage.locator('input[type="number"]').nth(2).fill("90");
    await verifierPage.getByTestId("confirmar-aprovacao").click();
    await verifierPage.waitForURL("/verificacao");

    // Etapa 5: negócio agora está verificado e público na vitrine
    // (RN-13) - fecha o laço até a tela seguinte do funil (M4).
    const business = await getBusinessByOwnerId(ownerId);
    expect(business?.status).toBe("verificado");
    expect(business?.nota_a).toBe(85);
    expect(business?.nota_s).toBe(78);
    expect(business?.nota_g).toBe(90);
    expect(business?.selo_valido_ate).toBeTruthy();

    await page.goto(`/negocios/${slug}`);
    await expect(page.getByRole("heading", { name: nome })).toBeVisible();

    await verifierContext.close();
  });
});
