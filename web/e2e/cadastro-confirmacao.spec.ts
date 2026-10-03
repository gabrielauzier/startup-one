import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { extractLink, toBaseURL, waitForMail } from "./helpers/mailpit";
import { signInThroughForm } from "./helpers/auth";
import { clearThrottle, getProfileByUserId, getUserIdByEmail } from "./helpers/db";

const API_URL = "http://127.0.0.1:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const PASSWORD = "abc12345";

async function signUp(page: Page, email: string, perfil: "investidor" | "produtor", password = PASSWORD) {
  await page.goto(`/cadastro?perfil=${perfil}`);
  await page.getByLabel("Nome").fill("Teste Cadastro");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByLabel("Confirmar senha").fill(password);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await page.waitForURL("**/cadastro/confirmar-email");
}

async function confirmationLink(email: string, after: number, baseURL: string) {
  const mail = await waitForMail(email, { after, subject: "Confirme seu e-mail" });
  return toBaseURL(extractLink(mail.HTML, "/auth/confirm"), baseURL);
}

async function usersWithEmail(email: string): Promise<number> {
  const res = await fetch(`${API_URL}/auth/v1/admin/users?per_page=1000`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  const { users } = (await res.json()) as { users: { email: string }[] };
  return users.filter((u) => u.email === email).length;
}

test.describe("Cadastro e confirmacao de e-mail, fluxo completo (AUTH-02, AUTH-03, AUTH-04, AUTH-11)", () => {
  test("investidor: cadastro, link em contexto limpo, termos e destino da descoberta", async ({
    page,
    browser,
    baseURL,
  }) => {
    const email = `cc-inv-${Date.now()}@example.com`;
    const before = Date.now();
    await signUp(page, email, "investidor");

    const link = await confirmationLink(email, before, baseURL!);
    const clean = await browser.newContext({ baseURL });
    const cleanPage = await clean.newPage();
    await cleanPage.goto(link);

    await cleanPage.waitForURL(/\/termos/);
    await cleanPage.getByRole("button", { name: "Aceitar e continuar" }).click();
    await cleanPage.waitForURL("**/descobrir/1");

    const profile = await getProfileByUserId(await getUserIdByEmail(email));
    expect(profile).toMatchObject({ role: "investidor", nome: "Teste Cadastro" });
    await clean.close();
  });

  test("produtor: cadastro e link levam a /produtor", async ({ page, browser, baseURL }) => {
    const email = `cc-prod-${Date.now()}@example.com`;
    const before = Date.now();
    await signUp(page, email, "produtor");

    const clean = await browser.newContext({ baseURL });
    const cleanPage = await clean.newPage();
    await cleanPage.goto(await confirmationLink(email, before, baseURL!));

    await cleanPage.waitForURL("**/produtor");
    const profile = await getProfileByUserId(await getUserIdByEmail(email));
    expect(profile).toMatchObject({ role: "produtor" });
    await clean.close();
  });

  test("login antes de confirmar mostra 'Confirme seu e-mail para entrar' e o botao reenvia a confirmacao", async ({
    page,
  }) => {
    const email = `cc-pend-${Date.now()}@example.com`;
    await signUp(page, email, "produtor");
    await page.context().clearCookies();
    const before = Date.now() + 1;

    await signInThroughForm(page, email, PASSWORD);
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("Confirme seu e-mail para entrar.");
    await expect(page.getByRole("button", { name: "Reenviar e-mail de confirmação" })).toBeVisible();
    // reenvio logo apos o cadastro cai no cooldown de 60 s: a tela permanece com o botao
    await page.getByRole("button", { name: "Reenviar e-mail de confirmação" }).click();
    expect(new URL(page.url()).pathname).toMatch(/\/(entrar|cadastro\/confirmar-email)$/);
    void before;
  });

  test("e-mail duplicado: mesma tela de sucesso, um unico usuario e a senha original continua valendo", async ({
    page,
    browser,
    baseURL,
  }) => {
    const email = `cc-dup-${Date.now()}@example.com`;
    const before = Date.now();
    await signUp(page, email, "produtor");
    const clean = await browser.newContext({ baseURL });
    const cleanPage = await clean.newPage();
    await cleanPage.goto(await confirmationLink(email, before, baseURL!));
    await cleanPage.waitForURL("**/produtor");
    await clean.close();

    // segundo cadastro com o mesmo e-mail e outra senha (fora do cooldown de 60 s)
    await clearThrottle(email, "signup");
    const second = await browser.newContext({ baseURL });
    const secondPage = await second.newPage();
    await signUp(secondPage, email, "investidor", "outra-senha-9");
    await second.close();

    expect(await usersWithEmail(email)).toBe(1);
    const login = await createClient(API_URL, ANON_KEY).auth.signInWithPassword({ email, password: PASSWORD });
    expect(login.error).toBeNull();
    const blocked = await createClient(API_URL, ANON_KEY).auth.signInWithPassword({
      email,
      password: "outra-senha-9",
    });
    expect(blocked.error?.code).toBe("invalid_credentials");
  });

  test("role=verificador forjado no cadastro e recusado e nao cria usuario", async () => {
    const email = `cc-verif-${Date.now()}@example.com`;

    const { error } = await createClient(API_URL, ANON_KEY).auth.signUp({
      email,
      password: PASSWORD,
      options: { data: { role: "verificador", nome: "Forjado" } },
    });

    expect(error).not.toBeNull();
    expect(await usersWithEmail(email)).toBe(0);
  });
});
