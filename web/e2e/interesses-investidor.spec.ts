import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import { createBusiness, createInterest, createProfileWithAuth, getInterest, getUserIdByEmail } from "./helpers/db";
import { loginAsInvestor } from "./helpers/auth";

test.describe("Meus interesses /interesses (T51)", () => {
  test("editar o valor de um interesse Pendente respeita o limite do 'Busca R$ X' (RN-36)", async ({
    page,
  }) => {
    const email = await loginAsInvestor(page, "meus-interesses-editar");
    const investorId = await getUserIdByEmail(email);
    const ownerId = await createProfileWithAuth("meus-interesses-owner", "produtor");
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug: `negocio-meus-interesses-${Date.now()}`,
      nome: "Negócio Meus Interesses",
      status: "verificado",
      valor_busca: 50_000,
    });
    const interestId = await createInterest(businessId, investorId, { valor: 5000 });

    await page.goto("/interesses");
    await expect(page.getByTestId("meu-interesse")).toHaveCount(1);

    await page.getByTestId("editar-interesse").click();
    await page.getByTestId("editar-interesse-valor").fill("60000");
    await page.getByTestId("salvar-interesse-valor").click();
    await expect(page.getByTestId("editar-interesse-erro")).toHaveText(
      "O valor não pode passar do que o negócio busca"
    );

    await page.getByTestId("editar-interesse-valor").fill("15000");
    await page.getByTestId("salvar-interesse-valor").click();
    await expect(page.getByTestId("editar-interesse")).toBeVisible();

    const interest = await getInterest(interestId);
    expect(Number(interest?.valor)).toBe(15000);
  });

  test("cancelar remove o interesse da soma de RN-29 (CA-29.2)", async ({ page }) => {
    const email = await loginAsInvestor(page, "meus-interesses-cancelar");
    const investorId = await getUserIdByEmail(email);
    const ownerId = await createProfileWithAuth("meus-interesses-cancel-owner", "produtor");
    const suffix = Date.now();
    const slug = `negocio-cancelar-${suffix}`;
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Cancelar ${suffix}`,
      status: "verificado",
      valor_busca: 100_000,
    });
    const interestId = await createInterest(businessId, investorId, { valor: 20_000 });

    await page.goto("/interesses");
    await page.getByTestId("cancelar-interesse").click();

    await expect(page.getByTestId("meu-interesse").filter({ hasText: "Cancelado" })).toBeVisible();

    const interest = await getInterest(interestId);
    expect(interest?.status).toBe("cancelado");

    // CA-29.2: o negócio deixa de contar esse interesse na soma
    // "Interesse de investidores" (RN-29, `sumInterests` do T38 já
    // ignora status diferente de pendente/aceito).
    await page.goto(`/negocios/${slug}`);
    await expect(page.getByText("R$ 0 de R$ 100 mil")).toBeVisible();
  });
});
