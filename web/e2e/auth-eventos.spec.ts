import { test, expect, type Page } from "@playwright/test";
import { reachRecoverySession, signInThroughForm } from "./helpers/auth";
import { getEventsByType, getUserIdByEmail } from "./helpers/db";
import { extractLink, toBaseURL, waitForMail } from "./helpers/mailpit";
import { createConfirmedUser, TEST_PASSWORD } from "./helpers/session";

const AUTH_TYPES = [
  "auth_cadastro_enviado",
  "auth_email_confirmado",
  "auth_login_senha_ok",
  "auth_login_senha_erro",
  "auth_magic_link_pedido",
  "auth_magic_link_ok",
  "auth_reset_pedido",
  "auth_reset_codigo_ok",
  "auth_reset_codigo_erro",
  "auth_senha_alterada",
  "auth_logout",
] as const;

async function counts(): Promise<Record<string, number>> {
  const entries = await Promise.all(
    AUTH_TYPES.map(async (type) => [type, (await getEventsByType(type)).length] as const)
  );
  return Object.fromEntries(entries);
}

/** Registra toda URL navegada/requisitada pela pagina para provar que nenhuma carrega o e-mail. */
function trackUrls(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (req) => urls.push(req.url()));
  page.on("framenavigated", (frame) => urls.push(frame.url()));
  return urls;
}

test.describe("Eventos de auth e ausencia de PII (AUTH-15, RNF-06)", () => {
  test("cada um dos 11 tipos e gravado pelo fluxo correspondente; payloads e URLs sem PII", async ({
    page,
    browser,
    baseURL,
  }) => {
    test.setTimeout(150_000);
    const before = await counts();
    const stamp = Date.now();
    const urls = trackUrls(page);
    const emails: string[] = [];

    // cadastro + confirmacao (auth_cadastro_enviado, auth_email_confirmado)
    const signupEmail = `ev-signup-${stamp}@example.com`;
    emails.push(signupEmail);
    const t0 = Date.now();
    await page.goto("/cadastro?perfil=produtor");
    await page.getByLabel("Nome").fill("Evento Teste");
    await page.getByLabel("E-mail", { exact: true }).fill(signupEmail);
    await page.getByLabel("Senha", { exact: true }).fill("abc12345");
    await page.getByLabel("Confirmar senha").fill("abc12345");
    await page.getByRole("button", { name: "Criar conta" }).click();
    await page.waitForURL("**/cadastro/confirmar-email");
    const confirmMail = await waitForMail(signupEmail, { after: t0, subject: "Confirme seu e-mail" });
    const clean = await browser.newContext({ baseURL });
    const cleanPage = await clean.newPage();
    await cleanPage.goto(toBaseURL(extractLink(confirmMail.HTML, "/auth/confirm"), baseURL!));
    await cleanPage.waitForURL("**/produtor");
    await clean.close();

    // login erro e ok + logout (auth_login_senha_erro, auth_login_senha_ok, auth_logout)
    const loginEmail = `ev-login-${stamp}@example.com`;
    emails.push(loginEmail);
    await createConfirmedUser(loginEmail, { role: "investidor", nome: "Login Evento" });
    await signInThroughForm(page, loginEmail, "senha-errada-9");
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("E-mail ou senha incorretos.");
    await signInThroughForm(page, loginEmail, TEST_PASSWORD);
    await page.waitForURL(/\/termos/);
    await page.getByRole("button", { name: "Aceitar e continuar" }).click();
    await page.waitForURL("**/descobrir/1");
    await page.getByRole("banner").getByRole("button", { name: "Sair" }).click();
    await page.waitForURL(/\/$/);

    // magic link (auth_magic_link_pedido, auth_magic_link_ok)
    const magicEmail = `ev-magic-${stamp}@example.com`;
    emails.push(magicEmail);
    await createConfirmedUser(magicEmail, { role: "produtor", nome: "Magic Evento" });
    const t1 = Date.now();
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(magicEmail);
    await page.getByRole("button", { name: "Receber link de acesso por e-mail" }).click();
    await page.waitForURL("**/entrar/link-enviado");
    const magicMail = await waitForMail(magicEmail, { after: t1 });
    const clean2 = await browser.newContext({ baseURL });
    const clean2Page = await clean2.newPage();
    await clean2Page.goto(toBaseURL(extractLink(magicMail.HTML, "/auth/confirm"), baseURL!));
    await clean2Page.waitForURL("**/produtor");
    await clean2.close();

    // reset (auth_reset_pedido, auth_reset_codigo_erro, auth_reset_codigo_ok, auth_senha_alterada)
    const resetEmail = `ev-reset-${stamp}@example.com`;
    emails.push(resetEmail);
    await createConfirmedUser(resetEmail, { role: "produtor", nome: "Reset Evento" });
    await page.goto("/esqueci-senha");
    await page.getByLabel("E-mail").fill(resetEmail);
    await page.getByRole("button", { name: "Enviar código" }).click();
    await page.waitForURL("**/esqueci-senha/codigo");
    await page.getByLabel("Código de 6 dígitos").fill("000000");
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByRole("main").getByRole("alert").first()).toHaveText("Código inválido ou vencido.");
    await page.context().clearCookies();
    const resetEmail2 = `ev-reset2-${stamp}@example.com`;
    emails.push(resetEmail2);
    await createConfirmedUser(resetEmail2, { role: "produtor", nome: "Reset Evento 2" });
    await reachRecoverySession(page, resetEmail2);
    await page.getByLabel("Nova senha", { exact: true }).fill("nova-senha-evento-1");
    await page.getByLabel("Confirmar nova senha").fill("nova-senha-evento-1");
    await page.getByRole("button", { name: "Salvar nova senha" }).click();
    await page.waitForURL(/aviso=senha-alterada/);

    // 1) cada tipo ganhou ao menos um evento
    const after = await counts();
    for (const type of AUTH_TYPES) {
      expect(after[type], type).toBeGreaterThan(before[type]);
    }

    // 2) os eventos com ator apontam para o usuario certo
    const loginUserId = await getUserIdByEmail(loginEmail);
    expect((await getEventsByType("auth_login_senha_ok", loginUserId)).length).toBe(1);
    const confirmedUserId = await getUserIdByEmail(signupEmail);
    expect((await getEventsByType("auth_email_confirmado", confirmedUserId)).length).toBe(1);

    // 3) nenhum payload dos eventos de auth contem e-mail, senha, token ou codigo
    const secrets = ["abc12345", "nova-senha-evento-1", TEST_PASSWORD, "senha-errada-9", "000000"];
    for (const type of AUTH_TYPES) {
      for (const row of await getEventsByType(type)) {
        const payload = JSON.stringify(row.payload);
        expect(payload, `${type} payload`).not.toContain("@");
        for (const secret of secrets) expect(payload, `${type} payload`).not.toContain(secret);
        expect(payload, `${type} payload`).not.toMatch(/token|code|senha|password/i);
      }
    }

    // 4) nenhuma URL navegada ou requisitada carrega o e-mail
    for (const email of emails) {
      const local = email.split("@")[0];
      for (const url of urls) {
        expect(url, `URL com ${local}`).not.toContain(local);
        expect(decodeURIComponent(url), `URL com @`).not.toContain("example.com");
      }
    }
  });
});
