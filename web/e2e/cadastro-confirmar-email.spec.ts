import { test, expect, type Page } from "@playwright/test";
import { countMails, waitForMail } from "./helpers/mailpit";
import { seedThrottle } from "./helpers/db";
import { createConfirmedUser } from "./helpers/session";

async function signUp(page: Page, email: string) {
  await page.goto("/cadastro?perfil=investidor");
  await page.getByLabel("Nome").fill("Helena Confirma");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill("abc12345");
  await page.getByLabel("Confirmar senha").fill("abc12345");
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/cadastro/confirmar-email");
}

test.describe("/cadastro/confirmar-email (AUTH-02 critérios 13 a 15, AUTH-04 critério 11)", () => {
  test("mostra o e-mail do cookie, o botao em cooldown de 60 s com contagem, e envia a confirmacao", async ({
    page,
  }) => {
    const email = `conf-tela-${Date.now()}@example.com`;
    const before = Date.now();

    await signUp(page, email);

    await expect(page.getByText(email)).toBeVisible();
    const reenviar = page.getByRole("button", { name: /^Reenviar e-mail/ });
    await expect(reenviar).toBeDisabled();
    await expect(reenviar).toContainText("s)");
    const mail = await waitForMail(email, { after: before });
    expect(mail.Subject).toContain("Confirme seu e-mail");
  });

  test("sem cookie de contexto volta a /cadastro", async ({ page }) => {
    await page.goto("/cadastro/confirmar-email");

    await page.waitForURL("**/cadastro");
  });

  test("?erro=expirado com cookie mostra o aviso e 'Enviar novo link' habilitado, e reenvia", async ({
    page,
  }) => {
    const email = `conf-exp-${Date.now()}@example.com`;
    await signUp(page, email);
    const before = Date.now() + 1;
    await page.waitForTimeout(1100);

    await page.goto("/cadastro/confirmar-email?erro=expirado");

    await expect(page.getByRole("heading", { name: "Esse link venceu" })).toBeVisible();
    const novo = page.getByRole("button", { name: "Enviar novo link" });
    await expect(novo).toBeEnabled();
    // o throttle de 60 s do cadastro ainda vale: o reenvio imediato devolve a espera.
    await novo.click();
    await expect(page.getByRole("main").getByRole("alert").last()).toContainText("Aguarde");
    expect(await countMails(email, before)).toBe(0);
  });

  test("?erro=expirado sem cookie (outro navegador) pede o e-mail, envia o novo link e segue para a tela de confirmacao", async ({
    page,
  }) => {
    const email = `conf-exp-sem-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "investidor", nome: "Sem Cookie", confirmed: false });
    const before = Date.now();

    await page.goto("/cadastro/confirmar-email?erro=expirado");
    await page.getByLabel("E-mail do cadastro").fill(email);
    await page.getByRole("button", { name: "Enviar novo link" }).click();

    await page.waitForURL("**/cadastro/confirmar-email");
    expect(page.url()).not.toContain("erro=");
    await expect(page.getByText(email)).toBeVisible();
    const mail = await waitForMail(email, { after: before });
    expect(mail.Subject).toContain("Confirme seu e-mail");
  });

  test("4o pedido na mesma hora devolve 'Muitos pedidos' e nao envia", async ({ page }) => {
    const email = `conf-teto-${Date.now()}@example.com`;
    await signUp(page, email);
    await seedThrottle(email, "signup", 3);
    const before = Date.now();

    await page.goto("/cadastro/confirmar-email?erro=expirado");
    await page.getByRole("button", { name: "Enviar novo link" }).click();

    await expect(page.getByRole("main").getByRole("alert").last()).toContainText(
      "Muitos pedidos. Tente de novo em alguns minutos."
    );
    expect(await countMails(email, before)).toBe(0);
  });
});
