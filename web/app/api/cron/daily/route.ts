import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  selectExpiredDrafts,
  selectExpiredPendingDocumentRequests,
  selectExpiredReleasedAccess,
  selectExpiredPendingInterests,
} from "@/lib/cron/expiration";

/**
 * RNF-08: cron diário único que orquestra as 4 expirações do MVP, uma
 * Route Handler no lugar de crons soltos (substitui o que seria um
 * `expire-document-requests`/`expire-interests` separado - as rotas
 * antigas `expire-drafts`/`expire-seals`, T17/T29, continuam existindo
 * e não são tocadas aqui, fora do escopo estrito desta task):
 *
 *   1. Rascunhos sem atividade há 90 dias (RN-07) - apaga.
 *   2. Pedidos de documento Pendentes sem resposta em 7 dias (RN-32) -
 *      vira `expirado`.
 *   3. Acessos Liberados há mais de 30 dias (RN-33) - vira `expirado`.
 *   4. Interesses Pendentes sem resposta em 10 dias (RN-39) - vira
 *      `expirado` (primeira implementação real desta expiração).
 *
 * Idempotente por construção: cada passo só seleciona linhas ainda no
 * estado "vivo" (status='rascunho'/'pendente'/'liberado'/'pendente')
 * antes de mutar - depois da 1ª passada no dia, uma 2ª chamada não
 * encontra mais nada elegível e não muda nada, mesmo padrão já usado
 * em `expire-seals` (T29).
 *
 * Nenhuma das 4 expirações aqui enfileira um aviso via
 * `enqueueNotification` (T53): os 9 tipos de RF-31 não incluem nenhum
 * "está prestes a expirar" - `cadastro_recebido`, `ajuste_pedido`,
 * `selo_concedido`, `reprovacao`, `pedido_documento`,
 * `documento_liberado`, `interesse_recebido`, `interesse_aceito` e
 * `apresentacao_parceiro` são todos avisos de uma decisão já tomada,
 * não de um prazo se esgotando. Os `TODO(T53)` de "faltam N dias" em
 * `expire-drafts`/`expire-seals` continuam como TODO por isso: exigem
 * um novo tipo de aviso que RF-31 não define, decisão de produto fora
 * do escopo desta task.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  // 1) RN-07: rascunhos sem atividade ha 90 dias.
  const { data: drafts } = await admin
    .from("businesses")
    .select("id, created_at")
    .eq("status", "rascunho");

  const draftRows = [];
  for (const draft of drafts ?? []) {
    const { data: lastRevision } = await admin
      .from("business_revisions")
      .select("created_at")
      .eq("business_id", draft.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    draftRows.push({
      id: draft.id,
      createdAt: draft.created_at,
      lastRevisionAt: lastRevision?.created_at ?? null,
    });
  }

  const expiredDraftIds = selectExpiredDrafts(draftRows, now);
  if (expiredDraftIds.length > 0) {
    await admin.from("businesses").delete().in("id", expiredDraftIds);
  }

  // 2) RN-32: pedidos de documento Pendentes sem resposta em 7 dias.
  const { data: pendingRequests } = await admin
    .from("document_requests")
    .select("id, created_at")
    .eq("status", "pendente");

  const expiredRequestIds = selectExpiredPendingDocumentRequests(
    (pendingRequests ?? []).map((r) => ({ id: r.id, createdAt: r.created_at })),
    now
  );
  if (expiredRequestIds.length > 0) {
    await admin.from("document_requests").update({ status: "expirado" }).in("id", expiredRequestIds);
  }

  // 3) RN-33: acessos Liberados ha mais de 30 dias.
  const { data: releasedRequests } = await admin
    .from("document_requests")
    .select("id, created_at, expira_em")
    .eq("status", "liberado");

  const expiredAccessIds = selectExpiredReleasedAccess(
    (releasedRequests ?? []).map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      expiraEm: r.expira_em,
    })),
    now
  );
  if (expiredAccessIds.length > 0) {
    await admin.from("document_requests").update({ status: "expirado" }).in("id", expiredAccessIds);
  }

  // 4) RN-39: interesses Pendentes sem resposta em 10 dias.
  const { data: pendingInterests } = await admin
    .from("interests")
    .select("id, created_at")
    .eq("status", "pendente");

  const expiredInterestIds = selectExpiredPendingInterests(
    (pendingInterests ?? []).map((r) => ({ id: r.id, createdAt: r.created_at })),
    now
  );
  if (expiredInterestIds.length > 0) {
    await admin.from("interests").update({ status: "expirado" }).in("id", expiredInterestIds);
  }

  return NextResponse.json({
    ok: true,
    expired: {
      rascunhos: expiredDraftIds.length,
      pedidosDocumento: expiredRequestIds.length,
      acessosDocumento: expiredAccessIds.length,
      interesses: expiredInterestIds.length,
    },
  });
}
