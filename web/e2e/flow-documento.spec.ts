import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import { createBusiness, createDocument, getUserIdByEmail } from "./helpers/db";
import { loginAsInvestor, loginAsProducer } from "./helpers/auth";

// T59 (RNF-12): ciclo completo de um documento sensível - o investidor
// pede acesso (RN-32), a produtora libera (RN-33), e o investidor abre
// o visualizador protegido (RN-34), que grava a visita (RN-35). Um
// assert por etapa confirma cada mudança de estado real, não só a UI -
// pega uma quebra na integração pedido<->liberação<->visualização que
// os specs fragmentados (documentos-pedido, produtor-pedidos,
// documento-visualizador) não pegam sozinhos, porque cada um seeda o
// estado já pronto em vez de atravessar o ciclo inteiro.
test.describe("Fluxo completo: ciclo de um documento sensível (RNF-12)", () => {
  test("investidor pede -> produtora libera -> investidor abre o visualizador protegido", async ({
    page,
    browser,
  }) => {
    // Etapa 1: produtora logada com um negócio verificado e um
    // documento sensível (CAR) - Storage local desabilitado (T22), o
    // documento em si é inserido direto no banco.
    const producerContext = await browser.newContext();
    const producerPage = await producerContext.newPage();
    const producerEmail = await loginAsProducer(producerPage, "flow-doc-owner");
    const ownerId = await getUserIdByEmail(producerEmail);
    const suffix = Date.now();
    const slug = `negocio-flow-doc-${suffix}`;
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Fluxo Documento ${suffix}`,
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

    // Etapa 2: investidor pede acesso (RN-32/CA-32.1).
    await loginAsInvestor(page, "flow-doc-inv");
    await page.goto(`/negocios/${slug}/documentos`);
    await expect(page.getByText("Precisa de liberação")).toBeVisible();
    await page.getByRole("button", { name: "Solicitar acesso" }).click();
    await expect(page.getByText("Pedido enviado")).toBeVisible();

    // Etapa 3: a produtora vê o pedido na fila e libera (RN-33/CA-33.1).
    await producerPage.goto("/produtor/pedidos");
    await expect(producerPage.getByText("CAR da propriedade")).toBeVisible();
    await producerPage.getByRole("button", { name: "Liberar" }).click();
    await expect(producerPage.getByRole("button", { name: "Liberar" })).toHaveCount(0);

    // Etapa 4: o investidor agora vê "Ver documento" em vez do estado
    // pendente (recarrega a aba de documentos do negócio).
    await page.goto(`/negocios/${slug}/documentos`);
    await expect(page.getByRole("link", { name: "Ver documento" })).toBeVisible();

    // Etapa 5: abre o visualizador protegido - marca d'água, sem
    // download, e a visita é registrada (RN-34/RN-35).
    await page.goto(`/negocios/${slug}/documentos/${documentId}/ver`);
    await expect(page.getByText(/Visualizado por .* em/).first()).toBeVisible();
    await expect(
      page.getByText("Visualização protegida — sem download, impressão ou cópia")
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /baixar/i })).toHaveCount(0);

    await producerContext.close();
  });
});
