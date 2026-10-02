import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import { createBusiness, createPartner, getInterest, getUserIdByEmail } from "./helpers/db";
import { loginAsInvestor, loginAsProducer, loginAsVerifier } from "./helpers/auth";

// T59 (RNF-12): ciclo completo de um interesse - o investidor envia
// (RN-36/RN-38), a produtora aceita (RN-39), e o verificador apresenta
// a conexão ao parceiro financeiro (RN-40/RN-41). Um assert por etapa
// confirma cada transição real de `interests`/`connection_events`, não
// só a UI - pega uma quebra na integração enviar<->aceitar<->apresentar
// que os specs fragmentados (interesse-criar, produtor-interesses,
// verificacao-conexoes) não pegam sozinhos, porque cada um seeda o
// estado já pronto em vez de atravessar o ciclo inteiro.
test.describe("Fluxo completo: ciclo de um interesse (RNF-12)", () => {
  test("investidor envia -> produtora aceita -> verificador apresenta ao parceiro", async ({
    page,
    browser,
  }) => {
    // Etapa 1: produtora logada com um negócio verificado, indicado
    // por um parceiro financeiro (necessário para "Apresentar ao
    // parceiro" ter um destinatário de e-mail, RN-41).
    const producerContext = await browser.newContext();
    const producerPage = await producerContext.newPage();
    const producerEmail = await loginAsProducer(producerPage, "flow-int-owner");
    const ownerId = await getUserIdByEmail(producerEmail);
    const suffix = Date.now();
    const slug = `negocio-flow-int-${suffix}`;
    const nome = `Negócio Fluxo Interesse ${suffix}`;
    const partnerId = await createPartner("Parceiro Financeiro Fluxo", {
      email_contato: `parceiro-flow-int-${suffix}@example.com`,
    });
    await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome,
      status: "verificado",
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
      indicado_por: partnerId,
    });

    // Etapa 2: investidor envia o interesse pelo formulário real
    // (RN-36/RN-38/CA-38.2) - a confirmação e o horário são gravados.
    await loginAsInvestor(page, "flow-int-inv");
    await page.goto(`/negocios/${slug}`);
    await page.getByTestId("botao-tenho-interesse").click();
    await expect(page.getByTestId("interesse-modal")).toBeVisible();

    await page.getByTestId("interesse-valor").fill("5000");
    await page.getByTestId("interesse-mensagem").fill("Quero conhecer melhor o negócio.");
    await page.getByTestId("interesse-confirmacao").click();
    await page.getByTestId("enviar-interesse").click();

    await page.waitForURL(/\/interesse-enviado/);
    await expect(page.getByRole("heading", { name: "Interesse enviado" })).toBeVisible();
    const idMatch = page.url().match(/[?&]id=([^&]+)/);
    expect(idMatch).not.toBeNull();
    const interestId = idMatch![1];

    // Etapa 3: a produtora vê "Novo" em /produtor/interesses e aceita
    // (RN-39/CA-39.1) - grava o evento `aceita` em connection_events.
    await producerPage.goto("/produtor/interesses");
    await expect(producerPage.getByTestId("interesse-novo")).toHaveCount(1);
    await producerPage.getByTestId("aceitar-interesse").click();
    await expect(producerPage.getByTestId("interesse-novo")).toHaveCount(0);
    await expect(producerPage.getByText("Aceito")).toBeVisible();

    const interestAfterAccept = await getInterest(interestId);
    expect(interestAfterAccept?.status).toBe("aceito");

    // Etapa 4: o verificador apresenta a conexão ao parceiro financeiro
    // (RN-40/RN-41/CA-40.2) - último elo do ciclo.
    const verifierContext = await browser.newContext();
    const verifierPage = await verifierContext.newPage();
    await loginAsVerifier(verifierPage, "flow-int-verif");
    await verifierPage.goto("/verificacao/conexoes");

    const item = verifierPage.getByTestId("conexao-item").filter({ hasText: nome });
    await expect(item).toHaveCount(1);
    await item.getByTestId("apresentar-parceiro").click();

    await expect(item.getByText("Apresentamos as partes", { exact: true })).toBeVisible();
    await expect(item.getByTestId("apresentar-parceiro")).toHaveCount(0);
    await expect(item.getByText(/E-mail enviado a/)).toBeVisible();

    await producerContext.close();
    await verifierContext.close();
  });
});
