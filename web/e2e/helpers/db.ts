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
  const res = await fetch(`${API_URL}/auth/v1/admin/users?per_page=1000`, {
    headers: headers(),
  });
  const { users } = (await res.json()) as { users: { id: string; email: string }[] };
  const match = users.find((u) => u.email === email);
  if (!match) throw new Error(`Usuário ${email} não encontrado`);
  return match.id;
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

export async function createPartner(nome: string): Promise<string> {
  const res = await fetch(`${API_URL}/rest/v1/partners`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=representation" },
    body: JSON.stringify({ nome, tipo: "indicador", ativo: true }),
  });
  const rows = (await res.json()) as { id: string }[];
  return rows[0].id;
}
