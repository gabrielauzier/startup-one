import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import {
  promoteToVerifier,
  createBusiness as createBusinessAsService,
  createDocument,
  createDocumentRequest,
  createInterest,
  createConnectionEvent,
} from "./helpers/db";

// T57 (RNF-04): um bloco por tabela sensível do modelo de dados,
// cada um com ao menos 1 caso permitido e 1 negado por papel,
// confirmando o que a PRD permite.
//
// `profiles` já está coberta por `rls-profiles.spec.ts` e `businesses`
// já está coberta em profundidade por `rls-businesses.spec.ts` -
// mantidas fora deste arquivo para não duplicar (a task pede as 5
// tabelas restantes: businesses, documents, document_requests,
// interests, connection_events). `businesses` ainda ganha um bloco
// mínimo aqui (1 permitido + 1 negado) só para o Done-when "todas as
// tabelas têm ao menos 1 caso permitido e 1 negado testado" ficar
// verificável neste arquivo consolidado sem reabrir a suíte inteira
// de `rls-businesses.spec.ts`.

const API_URL = "http://127.0.0.1:54321";
const MAILPIT_URL = "http://127.0.0.1:54324";
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

async function getOtpCodeFromMailpit(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=to:${encodeURIComponent(email)}`
    );
    const { messages } = (await res.json()) as { messages: { ID: string }[] };

    if (messages.length > 0) {
      const detail = await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`);
      const body = (await detail.json()) as { Text: string };
      const match = body.Text.match(/\b\d{6}\b/);
      if (match) return match[0];
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Nenhum código OTP encontrado para ${email} no Mailpit`);
}

/** Loga via API (sem browser) e devolve o access_token + user id, já com profile criado. */
async function loginViaApi(
  emailPrefix: string,
  role: "investidor" | "empresa" | "produtor" | "verificador"
): Promise<{ accessToken: string; userId: string }> {
  const email = `${emailPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

  await fetch(`${API_URL}/auth/v1/otp`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, create_user: true }),
  });

  const code = await getOtpCodeFromMailpit(email);

  const verifyRes = await fetch(`${API_URL}/auth/v1/verify`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, token: code, type: "email" }),
  });
  const session = (await verifyRes.json()) as {
    access_token: string;
    user: { id: string };
  };

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
      nome: "teste rls-full",
    }),
  });

  if (role === "verificador") {
    await promoteToVerifier(session.user.id);
  }

  return { accessToken: session.access_token, userId: session.user.id };
}

async function selectAs(accessToken: string | null, table: string, query: string) {
  const res = await fetch(`${API_URL}/rest/v1/${table}?${query}`, {
    headers: accessToken
      ? { apikey: ANON_KEY, Authorization: `Bearer ${accessToken}` }
      : { apikey: ANON_KEY },
  });
  return { status: res.status, rows: (await res.json()) as Record<string, unknown>[] };
}

test.describe("RLS: businesses (T57)", () => {
  test("permitido: o dono lê o próprio negócio em qualquer status", async () => {
    const owner = await loginViaApi("rlsfull-biz-owner", "produtor");
    const res = await fetch(`${API_URL}/rest/v1/businesses`, {
      method: "POST",
      headers: { ...serviceHeaders(), Prefer: "return=representation" },
      body: JSON.stringify({
        owner_id: owner.userId,
        status: "rascunho",
        nome: `Negócio RLS Full ${Date.now()}`,
        cnpj: randomValidCnpj(),
      }),
    });
    const [business] = (await res.json()) as { id: string }[];

    const { status, rows } = await selectAs(
      owner.accessToken,
      "businesses",
      `id=eq.${business.id}&select=id`
    );
    expect(status).toBe(200);
    expect(rows).toEqual([{ id: business.id }]);
  });

  test("negado: investidor não vê negócio em_analise de outra pessoa", async () => {
    const owner = await loginViaApi("rlsfull-biz-owner2", "produtor");
    const res = await fetch(`${API_URL}/rest/v1/businesses`, {
      method: "POST",
      headers: { ...serviceHeaders(), Prefer: "return=representation" },
      body: JSON.stringify({
        owner_id: owner.userId,
        status: "em_analise",
        nome: `Negócio RLS Full Privado ${Date.now()}`,
        cnpj: randomValidCnpj(),
      }),
    });
    const [business] = (await res.json()) as { id: string }[];

    const investor = await loginViaApi("rlsfull-biz-inv", "investidor");
    const { status, rows } = await selectAs(
      investor.accessToken,
      "businesses",
      `id=eq.${business.id}&select=id`
    );
    expect(status).toBe(200);
    expect(rows).toEqual([]);
  });
});

test.describe("RLS: documents (RN-30, RN-32, T57)", () => {
  test("permitido: investidor logado vê metadados de documento não aberto_a_todos (RN-30)", async () => {
    const owner = await loginViaApi("rlsfull-doc-owner", "produtor");
    const businessId = await createBusinessAsService(owner.userId, { status: "verificado" });
    const documentId = await createDocument(businessId, { aberto_a_todos: false });

    const investor = await loginViaApi("rlsfull-doc-inv", "investidor");
    const { status, rows } = await selectAs(
      investor.accessToken,
      "documents",
      `id=eq.${documentId}&select=id`
    );
    expect(status).toBe(200);
    expect(rows).toEqual([{ id: documentId }]);
  });

  test("negado: visitante anônimo não vê documento sensível (só aberto_a_todos)", async () => {
    const owner = await loginViaApi("rlsfull-doc-owner2", "produtor");
    const businessId = await createBusinessAsService(owner.userId, { status: "verificado" });
    const documentId = await createDocument(businessId, { aberto_a_todos: false });

    const { status, rows } = await selectAs(null, "documents", `id=eq.${documentId}&select=id`);
    expect(status).toBe(200);
    expect(rows).toEqual([]);
  });
});

test.describe("RLS: document_requests (RN-30, RN-33, T57)", () => {
  test("permitido: a produtora dona do negócio vê o pedido feito ao seu documento", async () => {
    const owner = await loginViaApi("rlsfull-dreq-owner", "produtor");
    const businessId = await createBusinessAsService(owner.userId, { status: "verificado" });
    const documentId = await createDocument(businessId);

    const investor = await loginViaApi("rlsfull-dreq-inv", "investidor");
    const requestId = await createDocumentRequest(documentId, investor.userId);

    const { status, rows } = await selectAs(
      owner.accessToken,
      "document_requests",
      `id=eq.${requestId}&select=id`
    );
    expect(status).toBe(200);
    expect(rows).toEqual([{ id: requestId }]);
  });

  test("negado: outro investidor não vê o pedido de acesso alheio (CA-30.2)", async () => {
    const owner = await loginViaApi("rlsfull-dreq-owner2", "produtor");
    const businessId = await createBusinessAsService(owner.userId, { status: "verificado" });
    const documentId = await createDocument(businessId);

    const investorA = await loginViaApi("rlsfull-dreq-invA", "investidor");
    const requestId = await createDocumentRequest(documentId, investorA.userId);

    const investorB = await loginViaApi("rlsfull-dreq-invB", "investidor");
    const { status, rows } = await selectAs(
      investorB.accessToken,
      "document_requests",
      `id=eq.${requestId}&select=id`
    );
    expect(status).toBe(200);
    expect(rows).toEqual([]);
  });
});

test.describe("RLS: interests (RN-36, RN-39, T57)", () => {
  test("permitido: a produtora dona do negócio vê o interesse recebido (T48)", async () => {
    const owner = await loginViaApi("rlsfull-int-owner", "produtor");
    const businessId = await createBusinessAsService(owner.userId, { status: "verificado" });

    const investor = await loginViaApi("rlsfull-int-inv", "investidor");
    const interestId = await createInterest(businessId, investor.userId);

    const { status, rows } = await selectAs(
      owner.accessToken,
      "interests",
      `id=eq.${interestId}&select=id`
    );
    expect(status).toBe(200);
    expect(rows).toEqual([{ id: interestId }]);
  });

  test("negado: outro investidor não vê o interesse alheio (T51)", async () => {
    const owner = await loginViaApi("rlsfull-int-owner2", "produtor");
    const businessId = await createBusinessAsService(owner.userId, { status: "verificado" });

    const investorA = await loginViaApi("rlsfull-int-invA", "investidor");
    const interestId = await createInterest(businessId, investorA.userId);

    const investorB = await loginViaApi("rlsfull-int-invB", "investidor");
    const { status, rows } = await selectAs(
      investorB.accessToken,
      "interests",
      `id=eq.${interestId}&select=id`
    );
    expect(status).toBe(200);
    expect(rows).toEqual([]);
  });
});

test.describe("RLS: connection_events (RN-40, T57)", () => {
  test("permitido: o verificador vê a linha do tempo de qualquer interesse (T49)", async () => {
    const owner = await loginViaApi("rlsfull-ce-owner", "produtor");
    const businessId = await createBusinessAsService(owner.userId, { status: "verificado" });
    const investor = await loginViaApi("rlsfull-ce-inv", "investidor");
    const interestId = await createInterest(businessId, investor.userId);
    await createConnectionEvent(interestId, "pendente", investor.userId);

    const verifier = await loginViaApi("rlsfull-ce-verif", "verificador");
    const { status, rows } = await selectAs(
      verifier.accessToken,
      "connection_events",
      `interest_id=eq.${interestId}&select=id`
    );
    expect(status).toBe(200);
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  test("negado: investidor sem relação com o interesse não vê a linha do tempo alheia", async () => {
    const owner = await loginViaApi("rlsfull-ce-owner2", "produtor");
    const businessId = await createBusinessAsService(owner.userId, { status: "verificado" });
    const investorA = await loginViaApi("rlsfull-ce-invA", "investidor");
    const interestId = await createInterest(businessId, investorA.userId);
    await createConnectionEvent(interestId, "pendente", investorA.userId);

    const investorB = await loginViaApi("rlsfull-ce-invB", "investidor");
    const { status, rows } = await selectAs(
      investorB.accessToken,
      "connection_events",
      `interest_id=eq.${interestId}&select=id`
    );
    expect(status).toBe(200);
    expect(rows).toEqual([]);
  });
});
