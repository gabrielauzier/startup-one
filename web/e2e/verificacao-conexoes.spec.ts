import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import {
  createBusiness,
  createConnectionEvent,
  createInterest,
  createPartner,
  createProfileWithAuth,
} from "./helpers/db";
import { loginAsVerifier } from "./helpers/auth";

test.describe("Painel de conexões /verificacao/conexoes (T49)", () => {
  test("CA-40.1: interesse Pendente não aparece nem pode ser apresentado", async ({ page }) => {
    const suffix = Date.now();
    const nome = `Negócio Conexões Pendente ${suffix}`;
    const ownerId = await createProfileWithAuth("conexoes-pendente-owner", "produtor");
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug: `negocio-conexoes-pendente-${suffix}`,
      nome,
      status: "verificado",
      valor_busca: 100_000,
    });
    const investorId = await createProfileWithAuth("conexoes-pendente-inv", "investidor");
    await createInterest(businessId, investorId, { status: "pendente" });

    await loginAsVerifier(page, "conexoes-pendente-verif");
    await page.goto("/verificacao/conexoes");

    // Painel lista todos os interesses Aceitos globalmente (o
    // verificador vê tudo) - a lista pode já ter itens de outros
    // testes rodando em paralelo contra o mesmo banco local, então a
    // asserção é escopada ao negócio criado por este teste, não à
    // contagem total da página.
    await expect(page.getByTestId("conexao-item").filter({ hasText: nome })).toHaveCount(0);
  });

  test("CA-40.2: apresentar um interesse Aceito muda a etapa para 'Apresentamos as partes' e registra o e-mail ao parceiro", async ({
    page,
  }) => {
    const suffix = Date.now();
    const nome = `Negócio Conexões Aceito ${suffix}`;
    const partnerId = await createPartner("Parceiro Financeiro Teste", {
      email_contato: `parceiro-${suffix}@example.com`,
    });
    const ownerId = await createProfileWithAuth("conexoes-aceito-owner", "produtor");
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug: `negocio-conexoes-aceito-${suffix}`,
      nome,
      status: "verificado",
      valor_busca: 100_000,
      indicado_por: partnerId,
    });
    const investorId = await createProfileWithAuth("conexoes-aceito-inv", "investidor");
    const interestId = await createInterest(businessId, investorId, {
      status: "aceito",
      valor: 12_000,
    });

    await createConnectionEvent(interestId, "aceita", ownerId);

    await loginAsVerifier(page, "conexoes-aceito-verif");
    await page.goto("/verificacao/conexoes");

    const item = page.getByTestId("conexao-item").filter({ hasText: nome });
    await expect(item).toHaveCount(1);
    await item.getByTestId("apresentar-parceiro").click();

    await expect(item.getByText("Apresentamos as partes", { exact: true })).toBeVisible();
    await expect(item.getByTestId("apresentar-parceiro")).toHaveCount(0);
    await expect(item.getByText(/E-mail enviado a/)).toBeVisible();
  });
});
