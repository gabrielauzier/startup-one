import { test, expect } from "@playwright/test";
import { addSessionCookies, createConfirmedUser, TEST_PASSWORD } from "./helpers/session";

test.describe("Tela Entrar /entrar (AUTH-05)", () => {
  test("mostra e-mail, senha e os links, sem escolha de perfil, e sem nav inferior nem banner legal", async ({
    page,
  }) => {
    await page.goto("/entrar");

    await expect(page.getByRole("radio")).toHaveCount(0);
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.getByRole("link", { name: "Esqueci minha senha" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Receber link de acesso por e-mail" })
    ).toBeVisible();
    await expect(page.getByRole("contentinfo")).toHaveCount(0);
  });

  test("entra com e-mail e senha corretos e cai no destino do papel", async ({ page }) => {
    const email = `entrar-ok-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Entrar Ok" });

    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    await page.waitForURL("**/produtor");
  });

  test("honra o redirect permitido para o papel", async ({ page }) => {
    const email = `entrar-redirect-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Redirect" });

    await page.goto("/entrar?redirect=/produtor/pedidos");
    await expect(page.getByRole("status")).toContainText("Entre para continuar");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    await page.waitForURL("**/produtor/pedidos");
  });

  test("senha errada e e-mail inexistente mostram a mesma mensagem, anunciada como alerta", async ({
    page,
  }) => {
    const email = `entrar-erro-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Erro" });

    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill("senha-errada-1");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    const alert = page.getByRole("main").getByRole("alert");
    await expect(alert).toHaveText("E-mail ou senha incorretos.");
    await expect(page.getByLabel("Senha")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Senha")).toBeFocused();

    await page.getByLabel("E-mail").fill(`naoexiste-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(alert).toHaveText("E-mail ou senha incorretos.");
  });

  test("conta nao confirmada mostra o aviso e o botao de reenviar confirmacao", async ({ page }) => {
    const email = `entrar-pend-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Pendente", confirmed: false });

    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Confirme seu e-mail para entrar.");
    await expect(
      page.getByRole("button", { name: "Reenviar e-mail de confirmação" })
    ).toBeVisible();
  });

  test("usuario logado que abre /entrar vai ao destino do papel", async ({ page, context, baseURL }) => {
    const email = `entrar-logado-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Logado" });
    await addSessionCookies(context, baseURL!, email);

    await page.goto("/entrar");

    await page.waitForURL("**/produtor");
  });

  test("avisos de contexto: sem-permissao, senha-alterada e link-expirado", async ({ page }) => {
    await page.goto("/entrar?aviso=sem-permissao");
    await expect(page.getByRole("status")).toContainText("Essa área é de outro perfil");

    await page.goto("/entrar?aviso=senha-alterada");
    await expect(page.getByRole("status")).toContainText("Senha alterada. Entre com a nova senha.");

    await page.goto("/entrar?erro=link-expirado");
    await expect(page.getByRole("status")).toContainText("Esse link já foi usado ou venceu. Peça outro.");
  });

  test("pedir o link por e-mail leva a /entrar/link-enviado", async ({ page }) => {
    const email = `entrar-link-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Link" });

    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Receber link de acesso por e-mail" }).click();

    await page.waitForURL("**/entrar/link-enviado");
    expect(page.url()).not.toContain(encodeURIComponent(email));
    expect(page.url()).not.toContain("@");
  });

  test("redirect repetido usa o primeiro valor (?redirect=/produtor/pedidos&redirect=/x)", async ({ page }) => {
    const email = `entrar-lista-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Lista" });

    await page.goto("/entrar?redirect=/produtor/pedidos&redirect=/x");
    await expect(page.getByRole("status")).toContainText("Entre para continuar");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    await page.waitForURL("**/produtor/pedidos");
  });
});
