import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { countMails, extractLink, waitForMail } from "./helpers/mailpit";

/**
 * Contrato do GoTrue local que o design da feature assume (design.md,
 * "GoTrue verification"). Se um destes testes quebrar, o mapeamento
 * das actions de auth precisa ser ajustado, nao o spec.
 */
const API_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const newClient = () =>
  createClient(API_URL, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const PASSWORD = "senha-forte-123";

async function adminCreate(email: string, confirmed: boolean) {
  const res = await fetch(`${API_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: PASSWORD,
      email_confirm: confirmed,
      user_metadata: { role: "investidor" },
    }),
  });
  return (await res.json()) as { id: string };
}

async function userExists(email: string): Promise<boolean> {
  const res = await fetch(`${API_URL}/auth/v1/admin/users?per_page=1000`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  const { users } = (await res.json()) as { users: { email: string }[] };
  return users.some((u) => u.email === email);
}

test.describe("contrato do GoTrue (design: GoTrue verification)", () => {
  test("{{ .RedirectTo }} chega no link do e-mail de confirmacao e o signUp devolve usuario sem sessao", async () => {
    const email = `contract-redirect-${Date.now()}@example.com`;
    const before = Date.now();
    const next = "http://localhost:3100/negocios";

    const { data, error } = await newClient().auth.signUp({
      email,
      password: PASSWORD,
      options: { emailRedirectTo: next, data: { role: "investidor", nome: "Contrato" } },
    });

    expect(error).toBeNull();
    expect(data.session).toBeNull();
    const mail = await waitForMail(email, { after: before });
    const link = extractLink(mail.HTML, "/auth/confirm");
    expect(link).toContain("token_hash=");
    expect(link).toContain("type=signup");
    // O GoTrue injeta {{ .RedirectTo }} URL-encoded: o handler le via searchParams.
    expect(new URL(link).searchParams.get("next")).toBe(next);
  });

  test("signUp com e-mail ja confirmado devolve user_already_exists e nao envia e-mail (por isso o app consulta email_account_status antes)", async () => {
    const email = `contract-dup-${Date.now()}@example.com`;
    await adminCreate(email, true);
    const before = Date.now();

    const { error } = await newClient().auth.signUp({ email, password: "outra-senha-456" });

    expect(error?.code).toBe("user_already_exists");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(await countMails(email, before)).toBe(0);
  });

  test("signInWithOtp com shouldCreateUser:false e e-mail inexistente nao cria usuario", async () => {
    const email = `contract-nocreate-${Date.now()}@example.com`;

    const { error } = await newClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    expect(error).not.toBeNull();
    expect(await userExists(email)).toBe(false);
    expect(await countMails(email)).toBe(0);
  });

  test("link do magic link (token_hash, type=email) vira sessao via verifyOtp em outro cliente", async () => {
    const email = `contract-magic-${Date.now()}@example.com`;
    await adminCreate(email, true);
    const before = Date.now();

    const { error } = await newClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: "http://localhost:3100/negocios" },
    });
    expect(error).toBeNull();

    const mail = await waitForMail(email, { after: before });
    const link = new URL(extractLink(mail.HTML, "/auth/confirm"));
    const tokenHash = link.searchParams.get("token_hash")!;
    expect(link.searchParams.get("type")).toBe("email");

    const { data, error: verifyError } = await newClient().auth.verifyOtp({
      token_hash: tokenHash,
      type: "email",
    });
    expect(verifyError).toBeNull();
    expect(data.session?.access_token).toBeTruthy();

    const reuse = await newClient().auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    expect(reuse.error).not.toBeNull();
  });

  test("reset por OTP: e-mail traz 6 digitos, verifyOtp recovery cria sessao e updateUser com a mesma senha devolve codigo de erro", async () => {
    const email = `contract-reset-${Date.now()}@example.com`;
    await adminCreate(email, true);
    const before = Date.now();
    const client = newClient();

    const { error } = await client.auth.resetPasswordForEmail(email);
    expect(error).toBeNull();

    const mail = await waitForMail(email, { after: before });
    const code = mail.Text.match(/\b\d{6}\b/)?.[0];
    expect(code).toBeTruthy();

    const { data, error: verifyError } = await client.auth.verifyOtp({
      email,
      token: code!,
      type: "recovery",
    });
    expect(verifyError).toBeNull();
    expect(data.session).not.toBeNull();

    const same = await client.auth.updateUser({ password: PASSWORD });
    expect(same.error?.code).toBe("same_password");

    const changed = await client.auth.updateUser({ password: "nova-senha-789" });
    expect(changed.error).toBeNull();

    const login = await newClient().auth.signInWithPassword({ email, password: "nova-senha-789" });
    expect(login.error).toBeNull();
  });

  test("resetPasswordForEmail com e-mail inexistente nao devolve erro nem envia e-mail", async () => {
    const email = `contract-reset-none-${Date.now()}@example.com`;
    const { error } = await newClient().auth.resetPasswordForEmail(email);

    expect(error).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(await countMails(email)).toBe(0);
  });

  test("signInWithPassword: nao confirmado devolve email_not_confirmed; credencial errada devolve invalid_credentials", async () => {
    const stamp = Date.now();
    const pending = `contract-pend-${stamp}@example.com`;
    const ok = `contract-ok-${stamp}@example.com`;
    await adminCreate(pending, false);
    await adminCreate(ok, true);

    const unconfirmed = await newClient().auth.signInWithPassword({ email: pending, password: PASSWORD });
    expect(unconfirmed.error?.code).toBe("email_not_confirmed");

    const wrong = await newClient().auth.signInWithPassword({ email: ok, password: "errada-123" });
    expect(wrong.error?.code).toBe("invalid_credentials");

    const missing = await newClient().auth.signInWithPassword({
      email: `contract-nao-existe-${stamp}@example.com`,
      password: PASSWORD,
    });
    expect(missing.error?.code).toBe("invalid_credentials");
  });

  test("senha fora da politica (curta ou sem digito) e rejeitada com weak_password", async () => {
    const email = `contract-weak-${Date.now()}@example.com`;
    const short = await newClient().auth.signUp({ email, password: "abc123" });
    expect(short.error?.code).toBe("weak_password");

    const noDigit = await newClient().auth.signUp({ email, password: "somenteletras" });
    expect(noDigit.error?.code).toBe("weak_password");
  });
});
