import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import {
  createBusiness,
  createInterest,
  createProfileWithAuth,
  getInterest,
  getUserIdByEmail,
} from "./helpers/db";
import { loginAsProducer } from "./helpers/auth";
import type { Page } from "@playwright/test";

async function loginAsProducerWithBusiness(
  page: Page,
  prefix: string
): Promise<{ ownerId: string; businessId: string }> {
  const email = await loginAsProducer(page, prefix);
  const ownerId = await getUserIdByEmail(email);
  const businessId = await createBusiness(ownerId, {
    cnpj: randomValidCnpj(),
    slug: `negocio-${prefix}-${Date.now()}`,
    nome: `Negócio ${prefix}`,
    status: "verificado",
    valor_busca: 100_000,
    prazo_meses: 24,
    nota_a: 80,
    nota_s: 80,
    nota_g: 80,
  });
  return { ownerId, businessId };
}

test.describe("Quem tem interesse /produtor/interesses (T48)", () => {
  test("CA-39.1: 'Aceitar e seguir' muda a situação para Aceito e grava o evento de conexão", async ({
    page,
  }) => {
    const { businessId } = await loginAsProducerWithBusiness(page, "produtor-interesses-aceitar");
    const investorId = await createProfileWithAuth("investidor-aceitar", "investidor");
    const interestId = await createInterest(businessId, investorId, {
      valor: 8000,
      mensagem: "Quero saber mais.",
    });

    await page.goto("/produtor/interesses");
    await expect(page.getByTestId("interesse-novo")).toHaveCount(1);
    await expect(page.getByText("Quero saber mais.")).toBeVisible();

    await page.getByTestId("aceitar-interesse").click();

    await expect(page.getByTestId("interesse-novo")).toHaveCount(0);
    await expect(page.getByText("Aceito")).toBeVisible();

    const interest = await getInterest(interestId);
    expect(interest?.status).toBe("aceito");
  });

  test("CA-39.2: 'Recusar' mostra 'Não aceito pela produtora' sem revelar motivo", async ({
    page,
  }) => {
    const { businessId } = await loginAsProducerWithBusiness(page, "produtor-interesses-recusar");
    const investorId = await createProfileWithAuth("investidor-recusar", "investidor");
    await createInterest(businessId, investorId, { valor: 3000 });

    await page.goto("/produtor/interesses");
    await page.getByTestId("recusar-interesse").click();

    await expect(page.getByText("Não aceito pela produtora")).toBeVisible();
  });
});
