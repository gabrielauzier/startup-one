import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import { createBusiness, createDocument, getUserIdByEmail } from "./helpers/db";
import { loginAsProducer, loginAsInvestor } from "./helpers/auth";

test.describe("Documentos adicionais da produtora /produtor/painel/documentos-adicionais (T44)", () => {
  test("laudo já enviado aparece confirmado na tela da produtora e 'Precisa de liberação' para o investidor", async ({
    page,
    browser,
  }) => {
    const suffix = Date.now();
    const producerEmail = await loginAsProducer(page, `docs-adicionais-${suffix}`);
    const ownerId = await getUserIdByEmail(producerEmail);
    const slug = `negocio-docs-adicionais-${suffix}`;
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Docs Adicionais ${suffix}`,
      status: "verificado",
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
    });

    // O Storage local está desabilitado neste ambiente (mesmo gap do
    // T22/T24/T42) - simula um upload já concluído inserindo a linha
    // de `documents` direto via REST, em vez de exercitar o upload
    // real do PhotoUploader (que dependeria do Storage estar de pé).
    await createDocument(businessId, { titulo: "Laudo ambiental", tipo: "laudo" });

    await page.goto("/produtor/painel/documentos-adicionais");
    await expect(page.getByText(/Laudo ambiental enviado/)).toBeVisible();

    // O documento enviado aparece na aba Documentos do negócio com a
    // situação correta (Precisa de liberação - documento sensível,
    // sem pedido ainda).
    const investorContext = await browser.newContext();
    const investorPage = await investorContext.newPage();
    await loginAsInvestor(investorPage, "docs-adicionais-inv");
    await investorPage.goto(`/negocios/${slug}/documentos`);
    await expect(investorPage.getByText("Laudo ambiental")).toBeVisible();
    await expect(investorPage.getByText("Precisa de liberação")).toBeVisible();

    await investorContext.close();
  });
});
