import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import {
  createBusiness,
  createDocument,
  createDocumentRequest,
  createInterest,
  createProfileWithAuth,
  getUserIdByEmail,
} from "./helpers/db";
import { loginAsProducer } from "./helpers/auth";

test.describe("Painel do produtor /produtor/painel (T50)", () => {
  test("contadores de pedidos e interesses batem com os dados reais do negócio", async ({
    page,
  }) => {
    const email = await loginAsProducer(page, "painel-produtor");
    const ownerId = await getUserIdByEmail(email);
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug: `negocio-painel-${Date.now()}`,
      nome: "Negócio do Painel",
      status: "verificado",
      valor_busca: 100_000,
      nota_a: 70,
      nota_s: 80,
      nota_g: 90,
      verificado_em: new Date().toISOString(),
      selo_valido_ate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    const documentId = await createDocument(businessId, { titulo: "CAR" });
    const investidor1 = await createProfileWithAuth("painel-inv-1", "investidor");
    const investidor2 = await createProfileWithAuth("painel-inv-2", "investidor");
    await createDocumentRequest(documentId, investidor1);
    await createInterest(businessId, investidor1, { valor: 5000, status: "pendente" });
    await createInterest(businessId, investidor2, { valor: 7000, status: "pendente" });

    await page.goto("/produtor/painel");

    await expect(page.getByText("Selo Verificado Îasy")).toBeVisible();
    await expect(page.getByText("Ambiental 70")).toBeVisible();

    await expect(page.getByTestId("painel-pedidos")).toHaveText("1");
    await expect(page.getByTestId("painel-interesses")).toHaveText("2");

    await page.getByText("Ver meu perfil como o investidor vê").click();
    await page.waitForURL(/\/negocios\/negocio-painel-/);
  });

  test("CA-35.1: mesma pessoa visitando 3x no mesmo dia conta 1 visita no painel", async ({
    page,
    context,
  }) => {
    const email = await loginAsProducer(page, "painel-visitas-produtor");
    const ownerId = await getUserIdByEmail(email);
    const slug = `negocio-painel-visitas-${Date.now()}`;
    await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: "Negócio Visitas",
      status: "verificado",
      valor_busca: 100_000,
      nota_a: 70,
      nota_s: 80,
      nota_g: 90,
    });

    // Visitante anônimo (mesmo contexto/cookies) abre a página do
    // negócio 3 vezes - `recordProfileVisit` (T40) dedupe por
    // (negócio, cookie do visitante, dia).
    const visitorPage = await context.newPage();
    await visitorPage.goto(`/negocios/${slug}`);
    await visitorPage.goto(`/negocios/${slug}`);
    await visitorPage.goto(`/negocios/${slug}`);
    await visitorPage.close();

    await page.goto("/produtor/painel");
    await expect(page.getByTestId("painel-visitas")).toHaveText("1");
  });
});
