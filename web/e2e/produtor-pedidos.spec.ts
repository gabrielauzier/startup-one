import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import {
  createBusiness,
  createDocument,
  createDocumentRequest,
  createProfileWithAuth,
  getDocumentRequest,
  getUserIdByEmail,
} from "./helpers/db";
import { loginAsProducer, loginAsInvestor } from "./helpers/auth";

test.describe("Pedidos de documento da produtora /produtor/pedidos (T43)", () => {
  test("CA-32.3: Recusar mostra 'A produtora optou por não liberar' ao investidor, sem motivo", async ({
    page,
    browser,
  }) => {
    const suffix = Date.now();

    // Investidor loga primeiro só para existir o profile/id.
    const investorContext = await browser.newContext();
    const investorPage = await investorContext.newPage();
    const investorEmail = await loginAsInvestor(investorPage, `pedidos-recusar-inv-${suffix}`);
    const investorId = await getUserIdByEmail(investorEmail);

    const producerEmail = await loginAsProducer(page, `pedidos-recusar-${suffix}`);
    const ownerId = await getUserIdByEmail(producerEmail);
    const slug = `negocio-pedidos-recusar-${suffix}`;
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Pedidos Recusar ${suffix}`,
      status: "verificado",
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
    });
    const documentId = await createDocument(businessId, { titulo: "CAR", tipo: "car" });
    const requestId = await createDocumentRequest(documentId, investorId, { status: "pendente" });

    await page.goto("/produtor/pedidos");
    await expect(page.getByText("CAR")).toBeVisible();
    await page.getByRole("button", { name: "Recusar" }).click();
    await expect(page.getByRole("button", { name: "Recusar" })).toHaveCount(0);

    const updated = await getDocumentRequest(requestId);
    expect(updated?.status).toBe("recusado");

    // CA-32.3: o investidor vê a mensagem exata, sem motivo.
    await investorPage.goto(`/negocios/${slug}/documentos`);
    await expect(investorPage.getByText("A produtora optou por não liberar")).toBeVisible();
    await expect(investorPage.getByText(/motivo/i)).toHaveCount(0);

    await investorContext.close();
  });

  test("CA-33.2: retirar um acesso liberado nega a próxima página do documento imediatamente", async ({
    page,
    browser,
  }) => {
    const suffix = Date.now();
    const producerEmail = await loginAsProducer(page, `pedidos-retirar-${suffix}`);
    const ownerId = await getUserIdByEmail(producerEmail);
    const slug = `negocio-pedidos-retirar-${suffix}`;
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Pedidos Retirar ${suffix}`,
      status: "verificado",
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
    });
    const documentId = await createDocument(businessId, { titulo: "DAP", tipo: "dap" });

    // Contexto (cookies) separado do da produtora - senão o login do
    // investidor sobrescreveria a sessão da produtora na mesma `page`.
    const investorContext = await browser.newContext();
    const investorPage = await investorContext.newPage();
    const investorEmail = await loginAsInvestor(investorPage, "pedidos-retirar-inv");
    const investorId = await getUserIdByEmail(investorEmail);
    await createDocumentRequest(documentId, investorId, {
      status: "liberado",
      decidido_em: new Date().toISOString(),
    });

    // O investidor abre o documento normalmente enquanto liberado.
    await investorPage.goto(`/negocios/${slug}/documentos/${documentId}/ver`);
    await expect(investorPage.getByText("Você não tem acesso a este documento.")).toHaveCount(0);

    // A produtora retira o acesso.
    await page.goto("/produtor/pedidos");
    await expect(page.getByText("DAP")).toBeVisible();
    await page.getByRole("button", { name: "Retirar acesso" }).click();
    await expect(page.getByRole("button", { name: "Retirar acesso" })).toHaveCount(0);

    // A próxima abertura do documento pelo investidor é negada.
    await investorPage.goto(`/negocios/${slug}/documentos/${documentId}/ver`);
    await expect(investorPage.getByText("Você não tem acesso a este documento.")).toBeVisible();

    await investorContext.close();
  });

  test("CA-33.1: acesso liberado há 31 dias mostra 'Acesso expirado, solicite novamente' ao investidor", async ({
    page,
  }) => {
    const ownerId = await createProfileWithAuth("pedidos-expirado", "produtor");
    const suffix = Date.now();
    const slug = `negocio-pedidos-expirado-${suffix}`;
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Pedidos Expirado ${suffix}`,
      status: "verificado",
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
    });
    const documentId = await createDocument(businessId, { titulo: "Laudo", tipo: "laudo" });

    const investorEmail = await loginAsInvestor(page, "pedidos-expirado-inv");
    const investorId = await getUserIdByEmail(investorEmail);

    const dezenove = new Date();
    dezenove.setDate(dezenove.getDate() - 31);
    await createDocumentRequest(documentId, investorId, {
      status: "liberado",
      decidido_em: dezenove.toISOString(),
    });

    await page.goto(`/negocios/${slug}/documentos`);
    await expect(page.getByText("Acesso expirado, solicite novamente")).toBeVisible();
    await expect(page.getByRole("button", { name: "Solicitar acesso" })).toBeVisible();
  });
});
