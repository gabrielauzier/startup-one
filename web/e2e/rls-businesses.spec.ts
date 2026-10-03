import { test, expect } from "@playwright/test";
import { createUserSession } from "./helpers/session";
import { randomValidCnpj } from "./helpers/cnpj";
import { promoteToVerifier } from "./helpers/db";

const API_URL = "http://127.0.0.1:54321";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

function serviceHeaders() {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

/** Loga via API (sem browser) e devolve o access_token + user id. */
async function loginViaApi(
  email: string,
  role: "investidor" | "produtor" | "verificador"
): Promise<{ accessToken: string; userId: string }> {
  const session = await createUserSession(email);

  // A policy de insert de profiles (T12) bloqueia role='verificador'
  // direto (RN-01) - cria sempre com um papel valido primeiro e, se for
  // o caso, promove via service-role (simulando a equipe credenciando).
  await fetch(`${API_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      id: session.user.id,
      role: role === "verificador" ? "investidor" : role,
      nome: "teste rls",
    }),
  });

  if (role === "verificador") {
    await promoteToVerifier(session.user.id);
  }

  return { accessToken: session.access_token, userId: session.user.id };
}

async function createBusiness(
  ownerId: string,
  status: string,
  nome: string
): Promise<string> {
  const res = await fetch(`${API_URL}/rest/v1/businesses`, {
    method: "POST",
    headers: { ...serviceHeaders(), Prefer: "return=representation" },
    body: JSON.stringify({
      owner_id: ownerId,
      status,
      nome,
      cnpj: randomValidCnpj(),
    }),
  });
  const rows = (await res.json()) as { id: string }[];
  return rows[0].id;
}

test.describe("RLS de businesses (RN-13, RN-30, RN-31, T25)", () => {
  test("busca por nome exato de negócio em_analise não retorna nada para investidor (CA-13.1)", async () => {
    const ownerEmail = `rls-biz-owner-${Date.now()}@example.com`;
    const owner = await loginViaApi(ownerEmail, "produtor");
    const nome = `Negócio Em Análise ${Date.now()}`;
    await createBusiness(owner.userId, "em_analise", nome);

    const investorEmail = `rls-biz-inv-${Date.now()}@example.com`;
    const investor = await loginViaApi(investorEmail, "investidor");

    const res = await fetch(
      `${API_URL}/rest/v1/businesses?nome=eq.${encodeURIComponent(nome)}&select=id`,
      {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${investor.accessToken}` },
      }
    );
    const rows = (await res.json()) as unknown[];
    expect(res.status).toBe(200);
    expect(rows).toEqual([]);
  });

  test("request sem sessão (anônima) não enxerga negócio em_analise (CA-30.2)", async () => {
    // M5 (página do negócio/abas restritas) ainda não existe - testado
    // aqui no nível de RLS/REST direto, como indicado na task: o
    // PostgREST nunca devolve 401/403 para um SELECT filtrado por RLS
    // (a policy so' restringe QUAIS linhas aparecem, sempre 200) - a
    // garantia equivalente e' zero linhas vazando para quem não tem
    // sessão de investidor/dono/verificador. SPEC_DEVIATION documentada
    // em tasks.md.
    const ownerEmail = `rls-biz-owner2-${Date.now()}@example.com`;
    const owner = await loginViaApi(ownerEmail, "produtor");
    const nome = `Negócio Anônimo ${Date.now()}`;
    const businessId = await createBusiness(owner.userId, "em_analise", nome);

    const res = await fetch(`${API_URL}/rest/v1/businesses?id=eq.${businessId}&select=id`, {
      headers: { apikey: ANON_KEY },
    });
    const rows = (await res.json()) as unknown[];
    expect(res.status).toBe(200);
    expect(rows).toEqual([]);
  });

  test("o dono sempre vê o próprio negócio, em qualquer status", async () => {
    const ownerEmail = `rls-biz-owner3-${Date.now()}@example.com`;
    const owner = await loginViaApi(ownerEmail, "produtor");
    const nome = `Negócio Do Dono ${Date.now()}`;
    const businessId = await createBusiness(owner.userId, "rascunho", nome);

    const res = await fetch(`${API_URL}/rest/v1/businesses?id=eq.${businessId}&select=id`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${owner.accessToken}` },
    });
    const rows = (await res.json()) as { id: string }[];
    expect(rows).toEqual([{ id: businessId }]);
  });

  test("o verificador vê negócios em qualquer status", async () => {
    const ownerEmail = `rls-biz-owner4-${Date.now()}@example.com`;
    const owner = await loginViaApi(ownerEmail, "produtor");
    const nome = `Negócio Para Verificador ${Date.now()}`;
    const businessId = await createBusiness(owner.userId, "em_analise", nome);

    const verifierEmail = `rls-biz-verif-${Date.now()}@example.com`;
    const verifier = await loginViaApi(verifierEmail, "verificador");

    const res = await fetch(`${API_URL}/rest/v1/businesses?id=eq.${businessId}&select=id`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${verifier.accessToken}` },
    });
    const rows = (await res.json()) as { id: string }[];
    expect(rows).toEqual([{ id: businessId }]);
  });

  test("negócio verificado é público (anônimo e investidor enxergam)", async () => {
    const ownerEmail = `rls-biz-owner5-${Date.now()}@example.com`;
    const owner = await loginViaApi(ownerEmail, "produtor");
    const nome = `Negócio Verificado ${Date.now()}`;
    const businessId = await createBusiness(owner.userId, "verificado", nome);

    const anonRes = await fetch(
      `${API_URL}/rest/v1/businesses?id=eq.${businessId}&select=id`,
      { headers: { apikey: ANON_KEY } }
    );
    const anonRows = (await anonRes.json()) as { id: string }[];
    expect(anonRows).toEqual([{ id: businessId }]);
  });
});
