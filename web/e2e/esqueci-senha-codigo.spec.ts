import { test, expect, type Page } from "@playwright/test";
import { waitForMail } from "./helpers/mailpit";
import { clearThrottle } from "./helpers/db";
import { createConfirmedUser } from "./helpers/session";
import { createClient } from "@supabase/supabase-js";

const API_URL = "http://127.0.0.1:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

async function requestCode(page: Page, email: string): Promise<string> {
  const before = Date.now();
  await page.goto("/esqueci-senha");
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar código" }).click();
  await page.waitForURL("**/esqueci-senha/codigo");
  const mail = await waitForMail(email, { after: before });
  return mail.Text.match(/\b\d{6}\b/)![0];
}

const codeInput = (page: Page) => page.getByLabel("Código de 6 dígitos");
const confirmar = (page: Page) => page.getByRole("button", { name: "Confirmar" });

test.describe("/esqueci-senha/codigo (AUTH-08 critérios 4 a 9, AUTH-09)", () => {
  test("codigo correto abre a sessao de recuperacao e vai a /redefinir-senha", async ({ page }) => {
    const email = `cod-ok-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "investidor", nome: "Codigo" });
    const code = await requestCode(page, email);

    await expect(codeInput(page)).toHaveAttribute("inputmode", "numeric");
    await expect(codeInput(page)).toHaveAttribute("autocomplete", "one-time-code");
    await expect(codeInput(page)).toHaveAttribute("maxlength", "6");
    await codeInput(page).fill(code);
    await confirmar(page).click();

    await page.waitForURL("**/redefinir-senha");
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === "iasy_recovery")).toBe(true);
    expect(cookies.some((c) => c.name.endsWith("-auth-token"))).toBe(true);
  });

  test("codigo errado devolve 'Código inválido ou vencido.' e fica na tela", async ({ page }) => {
    const email = `cod-erro-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "investidor", nome: "Erro" });
    const code = await requestCode(page, email);
    const wrong = code === "000000" ? "111111" : "000000";

    await codeInput(page).fill(wrong);
    await confirmar(page).click();

    await expect(page.getByRole("main").getByRole("alert").first()).toHaveText("Código inválido ou vencido.");
    expect(new URL(page.url()).pathname).toBe("/esqueci-senha/codigo");
    // o erro persiste mesmo recarregando (limite de tentativas e' do servidor, nao do React)
    await page.reload();
    await codeInput(page).fill(wrong);
    await confirmar(page).click();
    await expect(page.getByRole("main").getByRole("alert").first()).toHaveText("Código inválido ou vencido.");
  });

  test("codigo substituido por um novo pedido falha, o novo funciona e um codigo ja usado nao serve de novo", async ({
    page,
  }) => {
    // O GoTrue so' reenvia a cada 60 s por usuario (max_frequency), entao espera a janela.
    test.setTimeout(150_000);
    const email = `cod-subst-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "investidor", nome: "Subst" });
    const first = await requestCode(page, email);

    await page.waitForTimeout(61_000);
    await clearThrottle(email, "reset");
    const before = Date.now();
    await page.goto("/esqueci-senha");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Enviar código" }).click();
    await page.waitForURL("**/esqueci-senha/codigo");
    const second = (await waitForMail(email, { after: before })).Text.match(/\b\d{6}\b/)![0];

    await codeInput(page).fill(first);
    await confirmar(page).click();
    await expect(page.getByRole("main").getByRole("alert").first()).toHaveText("Código inválido ou vencido.");

    await codeInput(page).fill(second);
    await confirmar(page).click();
    await page.waitForURL("**/redefinir-senha");

    // o codigo ja usado nao vale mais
    const reuse = await createClient(API_URL, ANON_KEY).auth.verifyOtp({
      email,
      token: second,
      type: "recovery",
    });
    expect(reuse.error).not.toBeNull();
  });

  test("Reenviar fica em cooldown de 60 s com contagem e sem cookie volta a /esqueci-senha", async ({
    page,
  }) => {
    const email = `cod-reenvio-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "investidor", nome: "Reenvio" });
    await requestCode(page, email);

    const reenviar = page.getByRole("button", { name: /^Reenviar código/ });
    await expect(reenviar).toBeDisabled();
    await expect(reenviar).toContainText("s)");

    await page.context().clearCookies();
    await page.goto("/esqueci-senha/codigo");
    await page.waitForURL("**/esqueci-senha");
  });
});
