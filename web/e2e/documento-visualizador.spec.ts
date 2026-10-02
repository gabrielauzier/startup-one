import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import {
  createBusiness,
  createDocument,
  createDocumentRequest,
  createProfileWithAuth,
  getDocumentViews,
  getUserIdByEmail,
} from "./helpers/db";
import { loginAsInvestor } from "./helpers/auth";

test.describe("Visualizador controlado /negocios/[slug]/documentos/[id]/ver (T42)", () => {
  test("CA-34.1/CA-35.1: mostra a marca d'água com nome/data, sem opção de baixar, e grava document_views", async ({
    page,
  }) => {
    const ownerId = await createProfileWithAuth("visualizador", "produtor");
    const suffix = Date.now();
    const slug = `negocio-visualizador-${suffix}`;
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Visualizador ${suffix}`,
      status: "verificado",
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
    });
    const documentId = await createDocument(businessId, {
      titulo: "CAR da propriedade",
      tipo: "car",
    });

    const investorEmail = await loginAsInvestor(page, "visualizador-inv");
    const investorId = await getUserIdByEmail(investorEmail);

    // RN-33: acesso liberado (dentro dos 30 dias) - o trigger de T39
    // calcula expira_em = decidido_em + 30 dias automaticamente.
    await createDocumentRequest(documentId, investorId, {
      status: "liberado",
      decidido_em: new Date().toISOString(),
    });

    await page.goto(`/negocios/${slug}/documentos/${documentId}/ver`);

    // CA-34.1: marca d'água com nome do investidor logado e a data
    // (repetida em mosaico - várias instâncias na tela de propósito).
    await expect(page.getByText(/Visualizado por .* em/).first()).toBeVisible();

    // CA-34.1: nenhuma opção de baixar/imprimir/salvar na tela.
    await expect(page.getByRole("link", { name: /baixar/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /baixar/i })).toHaveCount(0);
    await expect(page.getByText("Visualização protegida — sem download, impressão ou cópia")).toBeVisible();

    // CA-35.1: abrir o documento grava document_views (investidor,
    // documento, data/hora), visível no painel da produtora.
    await expect
      .poll(async () => {
        const views = await getDocumentViews(documentId);
        return views.filter((v) => v.investor_id === investorId).length;
      })
      .toBeGreaterThan(0);
  });

  test("investidor sem acesso liberado vê 'Você não tem acesso a este documento'", async ({
    page,
  }) => {
    const ownerId = await createProfileWithAuth("visualizador-negado", "produtor");
    const suffix = Date.now();
    const slug = `negocio-visualizador-negado-${suffix}`;
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Visualizador Negado ${suffix}`,
      status: "verificado",
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
    });
    const documentId = await createDocument(businessId, {
      titulo: "CAR da propriedade",
      tipo: "car",
    });

    await loginAsInvestor(page, "visualizador-negado-inv");

    await page.goto(`/negocios/${slug}/documentos/${documentId}/ver`);
    await expect(page.getByText("Você não tem acesso a este documento.")).toBeVisible();
  });
});
