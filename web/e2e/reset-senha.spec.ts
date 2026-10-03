import { test, expect } from "@playwright/test";
import { reachRecoverySession, signInThroughForm } from "./helpers/auth";
import { addSessionCookies, createConfirmedUser, TEST_PASSWORD } from "./helpers/session";

test.describe("Reset de senha completo (AUTH-08, AUTH-14)", () => {
  test("durante a sessao de recuperacao rotas privadas e publicas voltam a /redefinir-senha ate trocar a senha; depois liberam", async ({
    page,
  }) => {
    const email = `reset-restr-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "investidor", nome: "Restrito" });
    await reachRecoverySession(page, email);

    for (const path of ["/negocios", "/interesses", "/"]) {
      await page.goto(path);
      await page.waitForURL("**/redefinir-senha");
    }

    await page.getByLabel("Nova senha", { exact: true }).fill("nova-senha-1");
    await page.getByLabel("Confirmar nova senha").fill("nova-senha-1");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();
    await page.waitForURL(/aviso=senha-alterada/);

    await page.goto("/negocios");
    expect(new URL(page.url()).pathname).toBe("/negocios");
  });

  test("outra sessao do mesmo usuario perde o acesso depois da troca de senha", async ({
    page,
    browser,
    baseURL,
  }) => {
    const email = `reset-outras-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Outras" });

    const other = await browser.newContext({ baseURL });
    await addSessionCookies(other, baseURL!, email);
    const otherPage = await other.newPage();
    // logado: /entrar leva ao destino do papel (AUTH-01.9)
    await otherPage.goto("/entrar");
    await otherPage.waitForURL("**/produtor");

    await reachRecoverySession(page, email);
    await page.getByLabel("Nova senha", { exact: true }).fill("nova-senha-1");
    await page.getByLabel("Confirmar nova senha").fill("nova-senha-1");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();
    await page.waitForURL(/aviso=senha-alterada/);

    // sessao encerrada: /entrar volta a mostrar o formulario e rota privada pede login
    await otherPage.goto("/entrar");
    await expect(otherPage.getByLabel("Senha")).toBeVisible();
    expect(new URL(otherPage.url()).pathname).toBe("/entrar");
    await otherPage.goto("/produtor/pedidos");
    await otherPage.waitForURL(/\/entrar\?redirect=/);
    await other.close();
  });

  test("conta do MVP sem senha define a primeira senha pelo reset e passa a entrar por senha", async ({
    page,
    browser,
    baseURL,
  }) => {
    const email = `reset-mvp-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Conta MVP", password: null });

    await signInThroughForm(page, email, TEST_PASSWORD);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("E-mail ou senha incorretos.");

    await reachRecoverySession(page, email);
    await page.getByLabel("Nova senha", { exact: true }).fill("primeira-senha-1");
    await page.getByLabel("Confirmar nova senha").fill("primeira-senha-1");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();
    await page.waitForURL(/\/produtor\?aviso=senha-alterada/);

    const fresh = await browser.newContext({ baseURL });
    const freshPage = await fresh.newPage();
    await signInThroughForm(freshPage, email, "primeira-senha-1");
    await freshPage.waitForURL("**/produtor");
    await fresh.close();
  });

  test("e-mail inexistente chega a mesma tela de codigo e nenhum codigo serve", async ({ page }) => {
    const email = `reset-fantasma-${Date.now()}@example.com`;
    await page.goto("/esqueci-senha");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Enviar código" }).click();
    await page.waitForURL("**/esqueci-senha/codigo");

    await page.getByLabel("Código de 6 dígitos").fill("123456");
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByRole("main").getByRole("alert").first()).toHaveText("Código inválido ou vencido.");
  });
});
