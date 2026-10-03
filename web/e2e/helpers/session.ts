import type { BrowserContext } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";

const API_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export const TEST_PASSWORD = "senha-forte-123";

/** Cria um usuario de auth ja confirmado, com senha, via admin API. */
export async function createConfirmedUser(
  email: string,
  opts: {
    role?: "investidor" | "empresa" | "produtor";
    nome?: string;
    /** `null` cria a conta sem senha (como as contas do MVP, que entravam so por codigo). */
    password?: string | null;
    confirmed?: boolean;
    hasPassword?: boolean;
  } = {}
): Promise<string> {
  const res = await fetch(`${API_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      ...(opts.password === null ? {} : { password: opts.password ?? TEST_PASSWORD }),
      email_confirm: opts.confirmed ?? true,
      user_metadata: {
        ...(opts.role ? { role: opts.role, nome: opts.nome } : {}),
        ...(opts.hasPassword ? { has_password: true } : {}),
      },
    }),
  });
  const user = (await res.json()) as { id?: string; msg?: string };
  if (!user.id) throw new Error(`Falha ao criar ${email}: ${user.msg ?? res.status}`);
  return user.id;
}

/**
 * Entra por senha via API e injeta no contexto do browser exatamente os
 * cookies que o `@supabase/ssr` gravaria - o app enxerga a sessao sem
 * passar pela tela. Para testes que nao exercitam o login em si.
 */
export async function addSessionCookies(
  context: BrowserContext,
  baseURL: string,
  email: string,
  password: string = TEST_PASSWORD
): Promise<void> {
  const captured: { name: string; value: string }[] = [];
  const client = createServerClient(API_URL, ANON_KEY, {
    cookies: {
      getAll: () => [],
      setAll: (cookies) => {
        for (const { name, value } of cookies) captured.push({ name, value });
      },
    },
  });

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`signInWithPassword falhou para ${email}: ${error.message}`);
  // setAll e' assincrono dentro do cliente: espera o flush.
  for (let i = 0; i < 20 && captured.length === 0; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  await context.addCookies(captured.map(({ name, value }) => ({ name, value, url: baseURL })));
}

/** Entra por senha direto no GoTrue (sem browser) e devolve o token de acesso e o usuario. */
export async function signInViaApi(
  email: string,
  password: string = TEST_PASSWORD
): Promise<{ access_token: string; user: { id: string } }> {
  const res = await fetch(`${API_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const session = (await res.json()) as { access_token?: string; user?: { id: string }; msg?: string };
  if (!session.access_token || !session.user) {
    throw new Error(`Login por senha falhou para ${email}: ${session.msg ?? res.status}`);
  }
  return { access_token: session.access_token, user: session.user };
}

/**
 * Cria um usuario confirmado SEM `role` no metadado (sem profile - o teste
 * decide o que inserir) e devolve a sessao. Substitui o antigo login por
 * OTP via API (`/auth/v1/otp` + codigo do Mailpit) nos specs de RLS.
 */
export async function createUserSession(
  email: string
): Promise<{ access_token: string; user: { id: string } }> {
  await createConfirmedUser(email);
  return signInViaApi(email);
}
