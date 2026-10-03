import { test, expect } from "@playwright/test";
import { createUserSession } from "./helpers/session";

const API_URL = "http://127.0.0.1:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

/** Faz login via API (sem browser) e retorna o access_token e o user id. */
async function loginViaApi(email: string): Promise<{ accessToken: string; userId: string }> {
  const session = await createUserSession(email);

  return { accessToken: session.access_token, userId: session.user.id };
}

test.describe("RLS de profiles (RN-01, T12)", () => {
  test("requisição anônima tentando criar profile com role=verificador é bloqueada (CA-01.3)", async () => {
    const res = await fetch(`${API_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: "00000000-0000-0000-0000-000000000001",
        role: "verificador",
        nome: "invasor",
      }),
    });

    // Anonimo (papel "anon" sem nenhum grant de insert em profiles) leva
    // 401; um autenticado que viola o WITH CHECK leva 403 (proximo
    // teste) - a RN-01/CA-01.3 e' satisfeita nos dois casos: nenhuma
    // linha e' criada. Confirmamos o codigo Postgres de RLS (42501) para
    // garantir que foi bloqueado pela policy, nao por outro erro.
    expect(res.status).toBe(401);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("42501");
  });

  test("usuário autenticado não consegue definir o próprio papel como verificador (RN-01)", async () => {
    const email = `rls-${Date.now()}@example.com`;
    const { accessToken, userId } = await loginViaApi(email);

    // O profile ainda nao existe (so' e' criado pelo verifyOtp da UI) -
    // o proprio usuario tenta se auto-promover a verificador.
    const insertRes = await fetch(`${API_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: userId, role: "verificador", nome: "curioso" }),
    });

    // Diferente do anonimo (401, sem grant nenhum), um usuario autenticado
    // tem grant de insert mas viola o WITH CHECK - PostgREST responde 403
    // (CA-01.3).
    expect(insertRes.status).toBe(403);
    const body = (await insertRes.json()) as { code: string };
    expect(body.code).toBe("42501");
  });

  test("usuário autenticado consegue ler e criar o próprio profile com um papel válido", async () => {
    const email = `rls-ok-${Date.now()}@example.com`;
    const { accessToken, userId } = await loginViaApi(email);

    const insertRes = await fetch(`${API_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ id: userId, role: "investidor", nome: "helena" }),
    });
    expect(insertRes.status).toBe(201);

    const selectRes = await fetch(
      `${API_URL}/rest/v1/profiles?id=eq.${userId}&select=role`,
      {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` },
      }
    );
    const rows = (await selectRes.json()) as { role: string }[];
    expect(rows).toEqual([{ role: "investidor" }]);
  });
});
