import { test, expect } from "@playwright/test";
import { addSessionCookies, createConfirmedUser } from "./helpers/session";

test.describe("Cadastro /cadastro (AUTH-02)", () => {
  test("?perfil=produtor marca 'Produzo na Amazônia'; perfil invalido nao marca nada", async ({ page }) => {
    await page.goto("/cadastro?perfil=produtor");
    await expect(page.getByRole("radio", { name: "Produzo na Amazônia" })).toHaveAttribute(
      "aria-checked",
      "true"
    );

    await page.goto("/cadastro?perfil=verificador");
    await expect(page.getByRole("radio", { checked: true })).toHaveCount(0);
  });

  test("senha fraca ou confirmacao diferente bloqueia o envio no cliente, sem sair da tela", async ({
    page,
  }) => {
    await page.goto("/cadastro?perfil=investidor");
    await page.getByLabel("Nome").fill("Helena Teste");
    await page.getByLabel("E-mail", { exact: true }).fill(`cad-fraca-${Date.now()}@example.com`);

    await page.getByLabel("Senha", { exact: true }).fill("abc1234");
    await expect(page.getByText("Use ao menos 8 caracteres.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar conta" })).toBeDisabled();

    await page.getByLabel("Senha", { exact: true }).fill("abc12345");
    await page.getByLabel("Confirmar senha").fill("abc12346");
    await expect(page.getByText("As senhas não são iguais.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar conta" })).toBeDisabled();
    expect(new URL(page.url()).pathname).toBe("/cadastro");
  });

  test("cadastro valido leva a /cadastro/confirmar-email sem o e-mail na URL e cria o usuario nao confirmado", async ({
    page,
  }) => {
    const email = `cad-ok-${Date.now()}@example.com`;

    await page.goto("/cadastro?perfil=investidor");
    await page.getByLabel("Nome").fill("Helena Teste");
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill("abc12345");
    await page.getByLabel("Confirmar senha").fill("abc12345");
    await page.getByRole("button", { name: "Criar conta" }).click();

    await page.waitForURL("**/cadastro/confirmar-email");
    expect(page.url()).not.toContain("@");
    expect(page.url()).not.toContain("example.com");
  });

  test("usuario logado que abre /cadastro vai ao destino do papel", async ({ page, context, baseURL }) => {
    const email = `cad-logado-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Logado" });
    await addSessionCookies(context, baseURL!, email);

    await page.goto("/cadastro");

    await page.waitForURL("**/produtor");
  });

  test("a aba Criar conta esta marcada e Entrar leva a /entrar", async ({ page }) => {
    await page.goto("/cadastro");

    const tabs = page.getByRole("navigation", { name: "Entrar ou criar conta" });
    await expect(tabs.getByRole("link", { name: "Criar conta" })).toHaveAttribute("aria-current", "page");
    await tabs.getByRole("link", { name: "Entrar" }).click();
    await page.waitForURL("**/entrar");
  });
});
