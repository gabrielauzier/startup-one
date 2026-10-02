import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import { createBusiness, createProfileWithAuth } from "./helpers/db";
import { loginAsInvestor } from "./helpers/auth";

test.describe("Página do negócio /negocios/[slug] (T40)", () => {
  test("CA-30.1: aba 'A produção' só mostra as práticas marcadas pelo produtor", async ({
    page,
  }) => {
    const ownerId = await createProfileWithAuth("negocio-producao", "produtor");
    const suffix = Date.now();
    const slug = `negocio-producao-${suffix}`;
    await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Produção ${suffix}`,
      status: "verificado",
      cidade_ibge: "Belém",
      uf: "PA",
      produtos: ["Castanha"],
      praticas: ["Colhemos sem derrubar a mata"],
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
      recebe_visitas: false,
    });

    await page.goto(`/negocios/${slug}`);
    await expect(page.getByText("Colhemos sem derrubar a mata")).toBeVisible();
    await expect(page.getByText("Não usamos agrotóxicos")).toHaveCount(0);
  });

  test("CA-26.1: visitante sem sessão que abre a aba 'O negócio' é convidado a entrar", async ({
    page,
  }) => {
    const ownerId = await createProfileWithAuth("negocio-convite", "produtor");
    const suffix = Date.now();
    const slug = `negocio-convite-${suffix}`;
    await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Convite ${suffix}`,
      status: "verificado",
      cidade_ibge: "Belém",
      uf: "PA",
      produtos: ["Castanha"],
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
      recebe_visitas: false,
    });

    await page.goto(`/negocios/${slug}?aba=negocio`);
    const invite = page.getByText(
      "Você precisa entrar como investidor ou empresa para ver esta aba."
    );
    await expect(invite).toBeVisible();

    // O header global (gap de layout) também tem um link "Entrar" -
    // escopado ao convite inline da aba, que é o que RN-26/CA-26.1 pede.
    await invite.locator("..").getByRole("link", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/entrar\?redirect=/);
  });

  test("CA-31.1: aba 'Quem cuida' mostra nome e função, nunca telefone/e-mail/CPF", async ({
    page,
  }) => {
    const ownerId = await createProfileWithAuth(
      "negocio-quemcuida",
      "produtor",
      "Raimunda Responsável"
    );
    const suffix = Date.now();
    const slug = `negocio-quemcuida-${suffix}`;
    await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Quem Cuida ${suffix}`,
      status: "verificado",
      cidade_ibge: "Belém",
      uf: "PA",
      produtos: ["Castanha"],
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
      recebe_visitas: false,
    });

    await loginAsInvestor(page, "negocio-quemcuida-inv");

    await page.goto(`/negocios/${slug}?aba=quem-cuida`);
    await expect(page.getByText("Raimunda Responsável")).toBeVisible();
    await expect(page.getByText("Responsável pelo negócio")).toBeVisible();

    const bodyText = (await page.textContent("body")) ?? "";
    expect(bodyText).not.toMatch(/@example\.com/);
    expect(bodyText).not.toMatch(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/); // CPF
    expect(bodyText).not.toMatch(/\(\d{2}\)\s?\d{4,5}-\d{4}/); // telefone
  });
});
