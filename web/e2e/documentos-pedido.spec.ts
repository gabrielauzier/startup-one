import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import { createBusiness, createDocument, createProfileWithAuth } from "./helpers/db";
import { loginAsInvestor } from "./helpers/auth";

test.describe("Aba Documentos /negocios/[slug]/documentos (T41)", () => {
  test("CA-32.1: solicitar acesso muda a situação para 'Pedido enviado' e o botão some", async ({
    page,
  }) => {
    const ownerId = await createProfileWithAuth("documentos-pedido", "produtor");
    const suffix = Date.now();
    const slug = `negocio-documentos-${suffix}`;
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Documentos ${suffix}`,
      status: "verificado",
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
    });
    await createDocument(businessId, { titulo: "CAR da propriedade", tipo: "car" });

    await loginAsInvestor(page, "documentos-pedido-inv");

    await page.goto(`/negocios/${slug}/documentos`);
    await expect(page.getByText("Precisa de liberação")).toBeVisible();
    await expect(page.getByRole("button", { name: "Solicitar acesso" })).toBeVisible();

    await page.getByRole("button", { name: "Solicitar acesso" }).click();

    await expect(page.getByText("Pedido enviado")).toBeVisible();
    await expect(page.getByText("Aguardando a produtora")).toBeVisible();
    await expect(page.getByRole("button", { name: "Solicitar acesso" })).toHaveCount(0);
  });

  test("documento 'Aberto a todos' não exige pedido e mostra 'Ver documento'", async ({
    page,
  }) => {
    const ownerId = await createProfileWithAuth("documentos-aberto", "produtor");
    const suffix = Date.now();
    const slug = `negocio-doc-aberto-${suffix}`;
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Doc Aberto ${suffix}`,
      status: "verificado",
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
    });
    await createDocument(businessId, {
      titulo: "Resumo do negócio",
      tipo: "resumo",
      aberto_a_todos: true,
    });

    await loginAsInvestor(page, "documentos-aberto-inv");

    await page.goto(`/negocios/${slug}/documentos`);
    await expect(page.getByText("Aberto a todos")).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver documento" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Solicitar acesso" })).toHaveCount(0);
  });
});
