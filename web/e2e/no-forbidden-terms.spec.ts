import { test, expect, type Page } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import { loginAsInvestor, loginAsProducer } from "./helpers/auth";
import {
  createBusiness,
  createInterest,
  createProfileWithAuth,
  getUserIdByEmail,
} from "./helpers/db";

// T58 (RN-04): varre as 8 telas-chave de CA-04.1/CA-04.2 - confirma o
// rodapé de conexão literal e a ausência dos 5 termos proibidos.
// Mesma constante de `home.spec.ts`.
const FORBIDDEN_TERMS = [
  "investir agora",
  "rendimento",
  "retorno garantido",
  "captado",
  "captação",
];

const FOOTER_TEXT =
  "A Îasy não recebe nem movimenta dinheiro. O contrato e o pagamento são feitos por um parceiro financeiro autorizado.";

async function expectFooterAndNoForbiddenTerms(page: Page) {
  await expect(page.getByText(FOOTER_TEXT)).toBeVisible();

  const html = (await page.content()).toLowerCase();
  for (const term of FORBIDDEN_TERMS) {
    expect(html).not.toContain(term);
  }
}

test.describe("Rodapé de conexão e ausência de termos proibidos em todo o app (RN-04, T58)", () => {
  test("/ (T01)", async ({ page }) => {
    await page.goto("/");
    await expectFooterAndNoForbiddenTerms(page);
  });

  test("/descobrir/resultados (T08)", async ({ page }) => {
    await page.goto("/descobrir/resultados");
    await expectFooterAndNoForbiddenTerms(page);
  });

  test("/negocios (T09)", async ({ page }) => {
    await page.goto("/negocios");
    await expectFooterAndNoForbiddenTerms(page);
  });

  test("/negocios/[slug] (T10)", async ({ page }) => {
    const ownerId = await createProfileWithAuth("noforbidden-negocio-owner", "produtor");
    const slug = `negocio-noforbidden-${Date.now()}`;
    await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Sem Termos ${Date.now()}`,
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

    await page.goto(`/negocios/${slug}`);
    await expectFooterAndNoForbiddenTerms(page);
  });

  test("formulário de interesse aberto em /negocios/[slug]?interesse=1", async ({ page }) => {
    const ownerId = await createProfileWithAuth("noforbidden-formint-owner", "produtor");
    const slug = `negocio-noforbidden-formint-${Date.now()}`;
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Formulário Interesse ${Date.now()}`,
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
    void businessId;

    await loginAsInvestor(page, "noforbidden-formint-inv");
    await page.goto(`/negocios/${slug}?interesse=1`);
    await expect(page.getByTestId("interesse-modal")).toBeVisible();
    await expectFooterAndNoForbiddenTerms(page);
  });

  test("/negocios/[slug]/interesse-enviado (T47)", async ({ page }) => {
    const ownerId = await createProfileWithAuth("noforbidden-envi-owner", "produtor");
    const slug = `negocio-noforbidden-envi-${Date.now()}`;
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Interesse Enviado ${Date.now()}`,
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

    const email = await loginAsInvestor(page, "noforbidden-envi-inv");
    const investorId = await getUserIdByEmail(email);
    const interestId = await createInterest(businessId, investorId, { valor: 5000 });

    await page.goto(`/negocios/${slug}/interesse-enviado?id=${interestId}`);
    await expectFooterAndNoForbiddenTerms(page);
  });

  test("/produtor/cadastro/5 (PRO-06)", async ({ page }) => {
    const email = await loginAsProducer(page, "noforbidden-cadastro5");
    const ownerId = await getUserIdByEmail(email);
    await createBusiness(ownerId, { cnpj: randomValidCnpj(), status: "rascunho" });

    await page.goto("/produtor/cadastro/5");
    await expectFooterAndNoForbiddenTerms(page);
  });

  test("/produtor/interesses (T48)", async ({ page }) => {
    const email = await loginAsProducer(page, "noforbidden-interesses");
    const ownerId = await getUserIdByEmail(email);
    const businessId = await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug: `negocio-noforbidden-interesses-${Date.now()}`,
      status: "verificado",
      valor_busca: 100_000,
      nota_a: 70,
      nota_s: 80,
      nota_g: 90,
    });
    const investorId = await createProfileWithAuth("noforbidden-interesses-inv", "investidor");
    await createInterest(businessId, investorId, { valor: 5000, status: "pendente" });

    await page.goto("/produtor/interesses");
    await expectFooterAndNoForbiddenTerms(page);
  });
});
