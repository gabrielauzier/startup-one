import { test, expect } from "@playwright/test";
import { countMails, waitForMail } from "./helpers/mailpit";
import { createConfirmedUser } from "./helpers/session";

test.describe("/esqueci-senha (AUTH-08 critérios 1 e 3)", () => {
  test("e-mail existente: recebe o e-mail de recuperacao com 6 digitos e sem link; e-mail na URL nao aparece", async ({
    page,
  }) => {
    const email = `esq-existe-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "investidor", nome: "Esqueci" });
    const before = Date.now();

    await page.goto("/esqueci-senha");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Enviar código" }).click();

    await page.waitForURL("**/esqueci-senha/codigo");
    expect(page.url()).not.toContain("@");
    const mail = await waitForMail(email, { after: before });
    expect(mail.Subject).toContain("redefinir a senha");
    expect(mail.Text).toMatch(/\b\d{6}\b/);
    expect(mail.HTML).not.toContain("href=");
  });

  test("e-mail inexistente: mesmo redirecionamento e nenhum e-mail", async ({ page }) => {
    const email = `esq-nao-existe-${Date.now()}@example.com`;

    await page.goto("/esqueci-senha");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Enviar código" }).click();

    await page.waitForURL("**/esqueci-senha/codigo");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(await countMails(email)).toBe(0);
  });

  test("e-mail invalido mostra o erro e nao sai da tela", async ({ page }) => {
    await page.goto("/esqueci-senha");
    await page.getByLabel("E-mail").fill("sem-arroba");
    await page.getByRole("button", { name: "Enviar código" }).click();

    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Informe um e-mail válido.");
    expect(new URL(page.url()).pathname).toBe("/esqueci-senha");
  });

  test("link 'Esqueci minha senha' de /entrar leva para ca", async ({ page }) => {
    await page.goto("/entrar");
    await page.getByRole("link", { name: "Esqueci minha senha" }).click();

    await page.waitForURL("**/esqueci-senha");
  });
});
