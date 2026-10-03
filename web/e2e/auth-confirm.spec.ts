import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { extractLink, toBaseURL, waitForMail } from "./helpers/mailpit";
import { createConfirmedUser, TEST_PASSWORD } from "./helpers/session";

const API_URL = "http://127.0.0.1:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const client = () =>
  createClient(API_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

test.describe("/auth/confirm (AUTH-04, AUTH-07)", () => {
  test("link de confirmacao de cadastro aberto em contexto limpo cria a sessao e segue o destino do papel", async ({
    page,
    baseURL,
  }) => {
    const email = `confirm-signup-${Date.now()}@example.com`;
    const before = Date.now();
    const { error } = await client().auth.signUp({
      email,
      password: TEST_PASSWORD,
      options: {
        emailRedirectTo: `${baseURL}/negocios`,
        data: { role: "produtor", nome: "Confirma" },
      },
    });
    expect(error).toBeNull();

    const mail = await waitForMail(email, { after: before });
    const link = toBaseURL(extractLink(mail.HTML, "/auth/confirm"), baseURL!);

    await page.goto(link);

    // produtor pode abrir /negocios (publica): o `next` e honrado
    await page.waitForURL("**/negocios");
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name.startsWith("sb-"))).toBe(true);
  });

  test("reabrir o mesmo link de confirmacao leva a /cadastro/confirmar-email?erro=expirado", async ({
    page,
    baseURL,
  }) => {
    const email = `confirm-reuse-${Date.now()}@example.com`;
    const before = Date.now();
    await client().auth.signUp({
      email,
      password: TEST_PASSWORD,
      options: { data: { role: "produtor", nome: "Reuso" } },
    });
    const mail = await waitForMail(email, { after: before });
    const link = toBaseURL(extractLink(mail.HTML, "/auth/confirm"), baseURL!);

    await page.goto(link);
    await page.waitForURL("**/produtor");
    await page.context().clearCookies();
    await page.goto(link);

    await page.waitForURL("**/cadastro/confirmar-email?erro=expirado");
  });

  test("magic link (type=email) abre a sessao e honra o next seguro", async ({
    page,
    baseURL,
  }) => {
    const email = `confirm-magic-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Magica" });
    const before = Date.now();
    const { error } = await client().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: `${baseURL}/negocios` },
    });
    expect(error).toBeNull();

    const mail = await waitForMail(email, { after: before });
    await page.goto(toBaseURL(extractLink(mail.HTML, "/auth/confirm"), baseURL!));

    await page.waitForURL("**/negocios");
    expect((await page.context().cookies()).some((c) => c.name.startsWith("sb-"))).toBe(true);
  });

  test("link de magic link ja usado leva a /entrar?erro=link-expirado", async ({ page, baseURL }) => {
    const email = `confirm-magic-reuse-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Reuso" });
    const before = Date.now();
    await client().auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    const mail = await waitForMail(email, { after: before });
    const link = toBaseURL(extractLink(mail.HTML, "/auth/confirm"), baseURL!);

    await page.goto(link);
    await page.waitForURL("**/produtor");
    await page.context().clearCookies();
    await page.goto(link);

    await page.waitForURL("**/entrar?erro=link-expirado");
  });

  test("type=recovery e next externo sao ignorados", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=abc&type=recovery");
    await page.waitForURL("**/entrar?erro=link-expirado");
  });
});
