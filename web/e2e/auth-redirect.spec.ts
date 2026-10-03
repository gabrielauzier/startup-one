import { test, expect, type Page } from "@playwright/test";
import { loginAsInvestor, loginAsProducer, loginAsVerifier } from "./helpers/auth";
import { createConfirmedUser } from "./helpers/session";

async function expectNoJsonError(page: Page) {
  const body = await page.locator("body").innerText();
  expect(body).not.toContain("Sem permissão");
  expect(body).not.toContain('"error"');
}

test.describe("Destino pos-login e papel errado (AUTH-01, AUTH-16, AUTH-17)", () => {
  test("investidor com redirect para a area do produtor cai na area dele, sem JSON 403", async ({ page }) => {
    const email = `red-inv-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "investidor", nome: "Inv" });

    await page.goto("/entrar?redirect=/produtor/painel");
    await signInThroughFormOnPage(page, email);
    await page.waitForURL(/\/termos/);
    await page.getByRole("button", { name: "Aceitar e continuar" }).click();

    await page.waitForURL("**/descobrir/1");
    await expectNoJsonError(page);
  });

  test("produtor com redirect para /interesses cai na area dele", async ({ page }) => {
    const email = `red-prod-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Prod" });

    await page.goto("/entrar?redirect=/interesses");
    await signInThroughFormOnPage(page, email);

    await page.waitForURL("**/produtor");
    await expectNoJsonError(page);
  });

  for (const evil of ["//evil.com", "/\\evil.com", "https://evil.com", "/entrar"]) {
    test(`redirect ${evil} e ignorado e o usuario cai no destino do papel`, async ({ page }) => {
      const email = `red-evil-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;
      await createConfirmedUser(email, { role: "produtor", nome: "Evil" });

      await page.goto(`/entrar?redirect=${encodeURIComponent(evil)}`);
      await signInThroughFormOnPage(page, email);

      await page.waitForURL("**/produtor");
      expect(page.url()).not.toContain("evil.com");
    });
  }

  test("papel errado por URL direta: investidor vai a /negocios com a faixa de aviso", async ({ page }) => {
    await loginAsInvestor(page, "red-direto-inv");

    await page.goto("/produtor/painel");

    await page.waitForURL("**/negocios?aviso=sem-permissao");
    await expect(page.getByRole("status")).toContainText("Essa área é de outro perfil");
    await expectNoJsonError(page);
  });

  test("papel errado por URL direta: produtor vai a /produtor e verificador a /verificacao", async ({ page }) => {
    await loginAsProducer(page, "red-direto-prod");
    await page.goto("/interesses");
    await page.waitForURL("**/produtor?aviso=sem-permissao");
    await expectNoJsonError(page);

    await loginAsVerifier(page, "red-direto-verif");
    await page.goto("/produtor/painel");
    await page.waitForURL("**/verificacao?aviso=sem-permissao");
    await expectNoJsonError(page);
  });

  test("Sair encerra a sessao: volta a /, o cabecalho mostra Entrar e rota privada pede login de novo", async ({
    page,
  }) => {
    await loginAsInvestor(page, "red-sair");
    await page.goto("/negocios");

    await page.getByRole("banner").getByRole("button", { name: "Sair" }).click();

    await page.waitForURL(/\/$/);
    await expect(page.getByRole("banner").getByRole("link", { name: "Entrar" })).toBeVisible();
    expect((await page.context().cookies()).some((c) => c.name.endsWith("-auth-token"))).toBe(false);
    await page.goto("/interesses");
    await page.waitForURL(/\/entrar\?redirect=%2Finteresses/);
  });

  test("visitante: /produtor abre sem login e as rotas de trabalho pedem login", async ({ page }) => {
    await page.goto("/produtor");
    expect(new URL(page.url()).pathname).toBe("/produtor");

    for (const path of ["/produtor/cadastro/1", "/produtor/painel", "/produtor/pedidos", "/produtor/interesses"]) {
      await page.goto(path);
      await page.waitForURL(/\/entrar\?redirect=/);
    }
  });
});

/** Preenche e envia o formulario da pagina ja aberta (preserva o `?redirect=` da URL). */
async function signInThroughFormOnPage(page: Page, email: string) {
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("senha-forte-123");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

