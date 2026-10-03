const API_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

function headers() {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function getUserIdByEmail(email: string): Promise<string> {
  // O GoTrue local ignora o filtro `email=` (sempre devolve a 1a pagina,
  // 50 usuarios, sem filtrar) - pede uma pagina grande e filtra aqui.
  // Bug real descoberto nesta task: sem isso, `users[0]` pega um usuario
  // arbitrario, nao o do teste, e todo lookup por owner_id falha.
  //
  // Retry curto (T52): sob carga pesada (a suite completa rodando 5
  // workers em paralelo, centenas de signups acumulados na mesma
  // hora), o admin/users as vezes responde 1 linha atras do que acaba
  // de ser criado - nao e' o mesmo bug de paginacao (per_page=1000
  // continua trazendo todos os usuarios, confirmado via curl manual),
  // e' uma corrida de curtissimo prazo sob carga. Poll de ate' 2s antes
  // de desistir, mesmo padrao de retry ja usado por
  // `getOtpCodeFromMailpit` neste mesmo arquivo de helpers.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const res = await fetch(`${API_URL}/auth/v1/admin/users?per_page=1000`, {
      headers: headers(),
    });
    const { users } = (await res.json()) as { users: { id: string; email: string }[] };
    const match = users.find((u) => u.email === email);
    if (match) return match.id;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Usuário ${email} não encontrado`);
}

export async function getBusinessByOwnerId(
  ownerId: string
): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `${API_URL}/rest/v1/businesses?owner_id=eq.${ownerId}&select=*&order=created_at.desc&limit=1`,
    { headers: headers() }
  );
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows[0] ?? null;
}

/**
 * Insere uma evidencia diretamente via REST (service role), simulando
 * um upload ja concluido - o Storage local esta desabilitado neste
 * ambiente (ver Status do T22 em tasks.md), entao os e2e que precisam
 * passar da Parte 4 inserem a linha direto em vez de fazer um upload
 * real.
 */
export async function createEvidence(
  businessId: string,
  grupo: "onde_produz" | "produto" | "terra" | "selo"
): Promise<void> {
  await fetch(`${API_URL}/rest/v1/evidences`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      business_id: businessId,
      grupo,
      storage_path: `${businessId}/${grupo}/fake.jpg`,
      mime: "image/jpeg",
      tamanho: 1024,
    }),
  });
}

/**
 * CA-14.1 (Fix A, rodada 2 do Verifier): seeda uma revisao de rascunho
 * direto via REST (service role), simulando que o produtor ja preencheu
 * essa parte antes do pedido de ajuste - sem isso, os campos travados
 * de um teste de ajuste nasceriam vazios e o form nunca conseguiria
 * avancar (mesmo bug do Gap 1, so' que causado pelo seed do teste em
 * vez do `disabled` do form).
 */
/**
 * CA-14.1 (Fix A, rodada 2 do Verifier): le' o `dados` da revisao mais
 * recente de uma parte especifica - usado pelos testes de ajuste para
 * confirmar, direto no banco, o que ficou gravado apos o produtor
 * corrigir so' o campo liberado (e nada mais).
 */
export async function getLatestRevisionForPart(
  businessId: string,
  part: 1 | 2 | 3 | 4 | 5
): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `${API_URL}/rest/v1/business_revisions?business_id=eq.${businessId}&order=created_at.desc&select=dados,created_at`,
    { headers: headers() }
  );
  const rows = (await res.json()) as { dados: Record<string, unknown> }[];
  const match = rows.find((row) => row.dados.part === part);
  return match?.dados ?? null;
}

export async function createBusinessRevision(
  businessId: string,
  part: 1 | 2 | 3 | 4 | 5,
  dados: Record<string, unknown>
): Promise<void> {
  await fetch(`${API_URL}/rest/v1/business_revisions`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify({
      business_id: businessId,
      dados: { part, ...dados },
      status: "rascunho",
    }),
  });
}

/**
 * RN-01: nao existe fluxo de login normal para o papel `verificador` (so'
 * a equipe credencia). Para os e2e, loga como produtor/investidor
 * normalmente (cria a conta) e promove direto via REST com a
 * service-role key, simulando esse credenciamento manual.
 */
export async function promoteToVerifier(userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ role: "verificador" }),
  });
  if (!res.ok) {
    throw new Error(`Falha ao promover ${userId} a verificador: ${res.status}`);
  }
}

/**
 * Cria um negocio direto via REST (service role), ja com os campos
 * agregados que `submitBusiness` (T24) preencheria no envio - usado
 * pelos e2e da fila/analise de verificacao (T26+) para nao precisar
 * repetir o fluxo completo de 5 partes so' para chegar em `em_analise`.
 */
export async function createBusiness(
  ownerId: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const res = await fetch(`${API_URL}/rest/v1/businesses`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify({
      owner_id: ownerId,
      status: "em_analise",
      nome: `Negócio de Teste ${Date.now()}`,
      cnpj: null,
      ...overrides,
    }),
  });
  const rows = (await res.json()) as { id: string }[];
  return rows[0].id;
}

/**
 * Cria um usuário de auth + profile diretamente via REST (service
 * role), sem passar pelo fluxo de OTP - usado quando o teste só
 * precisa de um dono/investidor "de fundo" para satisfazer uma FK
 * (ex.: owner_id de um negócio), não de uma sessão logada de verdade.
 */
export async function createProfileWithAuth(
  prefix: string,
  role: "investidor" | "empresa" | "produtor" | "verificador",
  nome = "Perfil de Teste"
): Promise<string> {
  const email = `${prefix}-${Date.now()}@example.com`;
  const res = await fetch(`${API_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, email_confirm: true }),
  });
  const user = (await res.json()) as { id: string };
  await fetch(`${API_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify({ id: user.id, role, nome }),
  });
  return user.id;
}

export async function createPartner(
  nome: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const res = await fetch(`${API_URL}/rest/v1/partners`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify({ nome, tipo: "indicador", ativo: true, ...overrides }),
  });
  const rows = (await res.json()) as { id: string }[];
  return rows[0].id;
}

/** RN-23/T32: le' a linha de `investor_answers` de um investidor direto via REST. */
export async function getInvestorAnswers(
  investorId: string
): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `${API_URL}/rest/v1/investor_answers?investor_id=eq.${investorId}&select=*`,
    { headers: headers() }
  );
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows[0] ?? null;
}

/**
 * Cria um documento direto via REST (service role) - o Storage local
 * esta desabilitado neste ambiente (mesmo gap do T22, ver Status do
 * T42 em tasks.md), entao os e2e que precisam de um documento ja
 * "existente" inserem a linha direto em vez de fazer um upload real.
 */
export async function createDocument(
  businessId: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const res = await fetch(`${API_URL}/rest/v1/documents`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify({
      business_id: businessId,
      titulo: "Documento de teste",
      tipo: "car",
      storage_path: `${businessId}/car-fake.pdf`,
      aberto_a_todos: false,
      ...overrides,
    }),
  });
  const rows = (await res.json()) as { id: string }[];
  return rows[0].id;
}

/** Cria um pedido de acesso a documento direto via REST (service role). */
export async function createDocumentRequest(
  documentId: string,
  investorId: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const res = await fetch(`${API_URL}/rest/v1/document_requests`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify({
      document_id: documentId,
      investor_id: investorId,
      status: "pendente",
      ...overrides,
    }),
  });
  const rows = (await res.json()) as { id: string }[];
  return rows[0].id;
}

/** Le' um `document_requests` direto via REST (service role). */
export async function getDocumentRequest(id: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${API_URL}/rest/v1/document_requests?id=eq.${id}&select=*`, {
    headers: headers(),
  });
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows[0] ?? null;
}

/** Le' os `document_views` de um documento direto via REST (service role). */
export async function getDocumentViews(documentId: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `${API_URL}/rest/v1/document_views?document_id=eq.${documentId}&select=*`,
    { headers: headers() }
  );
  return (await res.json()) as Record<string, unknown>[];
}

/** Cria um interesse direto via REST (service role) - usado pelos e2e do T48/T49/T51. */
export async function createInterest(
  businessId: string,
  investorId: string,
  overrides: Record<string, unknown> = {}
): Promise<string> {
  const res = await fetch(`${API_URL}/rest/v1/interests`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify({
      business_id: businessId,
      investor_id: investorId,
      valor: 5000,
      status: "pendente",
      confirmacao_texto: "Entendo que estou demonstrando interesse, e não investindo agora",
      ...overrides,
    }),
  });
  const rows = (await res.json()) as { id: string }[];
  return rows[0].id;
}

/** Le' um `interests` direto via REST (service role). */
export async function getInterest(id: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${API_URL}/rest/v1/interests?id=eq.${id}&select=*`, {
    headers: headers(),
  });
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows[0] ?? null;
}

/**
 * Le' as linhas de `events` de um tipo (T53/T54, RF-31) direto via
 * REST (service role) - usado pelos e2e que confirmam o registro do
 * aviso ao enfileirar (`enqueueNotification`), sem depender de UI que
 * exponha a fila (tabela interna de operacao, sem policy de RLS de
 * leitura para nenhum perfil).
 */
export async function getEventsByType(
  type: string,
  destinatarioId?: string
): Promise<Record<string, unknown>[]> {
  const filter = destinatarioId ? `&destinatario_id=eq.${destinatarioId}` : "";
  const res = await fetch(
    `${API_URL}/rest/v1/events?type=eq.${type}${filter}&select=*&order=created_at.desc`,
    { headers: headers() }
  );
  return (await res.json()) as Record<string, unknown>[];
}

/** Cria um evento de conexao direto via REST (service role) - usado pelos e2e do T49. */
export async function createConnectionEvent(
  interestId: string,
  etapa: string,
  autorId: string,
  observacao?: string
): Promise<void> {
  await fetch(`${API_URL}/rest/v1/connection_events`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify({ interest_id: interestId, etapa, autor_id: autorId, observacao }),
  });
}

/**
 * Le' as linhas de `connection_events` de um interesse direto via REST
 * (service role) - usado pelo e2e CA-39.1 (Fix 7, rodada 1 do
 * Verifier) para confirmar que "Aceitar e seguir" grava mesmo a etapa
 * `aceita`, nao so' que o status de `interests` mudou.
 */
export async function getConnectionEvents(
  interestId: string
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `${API_URL}/rest/v1/connection_events?interest_id=eq.${interestId}&select=*&order=created_at.desc`,
    { headers: headers() }
  );
  return (await res.json()) as Record<string, unknown>[];
}

export async function getProfileByUserId(id: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${API_URL}/rest/v1/profiles?id=eq.${id}&select=*`, {
    headers: headers(),
  });
  const rows = (await res.json()) as Record<string, unknown>[];
  return rows[0] ?? null;
}

/** Grava `count` linhas de auth_throttle antigas (dentro da janela de 1 h, fora do cooldown) para o e-mail. */
export async function seedThrottle(
  email: string,
  kind: "signup" | "magic" | "reset",
  count: number
): Promise<void> {
  const { createHash } = await import("node:crypto");
  const keyHash = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  const createdAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  await fetch(`${API_URL}/rest/v1/auth_throttle`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify(
      Array.from({ length: count }, () => ({ key_hash: keyHash, kind, created_at: createdAt }))
    ),
  });
}
