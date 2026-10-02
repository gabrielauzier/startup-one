import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTransition } from "@/lib/business/state-machine";
import {
  selectExpiredDrafts,
  selectDraftsNearingExpiry,
  selectExpiredPendingDocumentRequests,
  selectExpiredReleasedAccess,
  selectExpiredPendingInterests,
  selectSealsNearingExpiry,
} from "@/lib/cron/expiration";
import { enqueueNotification, wasNearingExpiryNotified } from "@/lib/notifications/queue";

const DRAFT_WARNING_WINDOW_DAYS = 7;
const SEAL_WARNING_WINDOW_DAYS = 30;

/**
 * RNF-08/design.md: cron diário único (`design.md`: "Vercel Cron ...
 * roda 1x/dia (expira rascunhos RN-07, selos RN-19, pedidos RN-32/33,
 * interesses RN-39)") que orquestra TODAS as expirações do MVP:
 *
 *   1. Rascunhos sem atividade há 90 dias (RN-07) - apaga, avisando 7
 *      dias antes (CA-07.3).
 *   2. Pedidos de documento Pendentes sem resposta em 7 dias (RN-32) -
 *      vira `expirado`.
 *   3. Acessos Liberados há mais de 30 dias (RN-33) - vira `expirado`.
 *   4. Interesses Pendentes sem resposta em 10 dias (RN-39) - vira
 *      `expirado`.
 *   5. Selos (negócios `verificado`) vencidos (RN-19) - vira
 *      `expirado`, avisando 30 dias antes (CA-19.2).
 *
 * Histórico (Gap 2, rodada 2 do Verifier): até aqui, o aviso de 7 dias
 * (CA-07.3) só existia na rota antiga `/api/cron/expire-drafts`
 * (T17/Fix 5 da rodada 1), e os selos (passo 5) não eram processados
 * nesta rota - só em `/api/cron/expire-seals` (T29/Fix 5). Como
 * `design.md` só agenda `/api/cron/daily`, as rotas antigas
 * provavelmente nunca rodam em produção, deixando os dois avisos de
 * fato desligados. Decisão: `daily` agora é auto-suficiente (cobre os 5
 * passos, avisos incluídos) e é o único ponto que precisa estar
 * agendado. `expire-drafts`/`expire-seals` continuam existindo e
 * funcionando (redundantes, mas inofensivas - úteis como rota manual
 * de depuração) em vez de removidas, já que nada aqui depende de
 * apagá-las.
 *
 * Idempotente por construção: cada passo só seleciona linhas ainda no
 * estado "vivo" (status='rascunho'/'pendente'/'liberado'/'verificado')
 * antes de mutar, e os avisos de "faltam N dias" são deduplicados por
 * `wasNearingExpiryNotified` (Gap 3, rodada 2) - uma 2ª chamada no
 * mesmo dia (ou dentro da mesma janela de aviso) não repete nada.
 */
/**
 * Vercel Cron chama via GET com `Authorization: Bearer $CRON_SECRET`;
 * chamada manual/testes seguem via POST com `x-cron-secret`. Ambos
 * validam contra a mesma env `CRON_SECRET`.
 */
function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const header = request.headers.get("x-cron-secret");
  const bearer = request.headers.get("authorization");
  return header === expected || bearer === `Bearer ${expected}`;
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}

async function run(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  // 1) RN-07/CA-07.3: rascunhos sem atividade ha 90 dias - apaga,
  // avisando 7 dias antes.
  const { data: drafts } = await admin
    .from("businesses")
    .select("id, created_at, owner_id, nome")
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
  const draftsNearingExpiryIds = selectDraftsNearingExpiry(draftRows, now);

  const draftById = new Map((drafts ?? []).map((d) => [d.id, d]));
  let rascunhosAvisados = 0;
  for (const id of draftsNearingExpiryIds) {
    const draft = draftById.get(id);
    if (!draft) continue;

    const draftJaAvisado = await wasNearingExpiryNotified(
      admin,
      "rascunho_expirando_em_breve",
      id,
      DRAFT_WARNING_WINDOW_DAYS,
      now
    );
    if (draftJaAvisado) continue;

    await enqueueNotification({
      type: "rascunho_expirando_em_breve",
      payload: { businessId: id },
      destinatarioId: draft.owner_id,
      email: {
        subject: "Îasy - seu rascunho de cadastro expira em breve",
        body: `Faltam 7 dias para apagarmos o rascunho de ${draft.nome ?? "seu negócio"} por inatividade. Continue de onde parou para não perder o que já foi preenchido.`,
      },
    });
    rascunhosAvisados += 1;
  }

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

  // 5) RN-19/CA-19.2: selos (negocios verificado) vencidos - vira
  // expirado, avisando 30 dias antes.
  const { data: verificados } = await admin
    .from("businesses")
    .select("id, selo_valido_ate, owner_id, nome")
    .eq("status", "verificado");

  const expiredSealIds = (verificados ?? [])
    .filter((b) => b.selo_valido_ate && new Date(b.selo_valido_ate) < now)
    .map((b) => b.id);

  const sealsNearingExpiryIds = selectSealsNearingExpiry(
    (verificados ?? []).map((b) => ({ id: b.id, seloValidoAte: b.selo_valido_ate })),
    now
  );

  const sealById = new Map((verificados ?? []).map((b) => [b.id, b]));
  let selosAvisados = 0;
  for (const id of sealsNearingExpiryIds) {
    const business = sealById.get(id);
    if (!business) continue;

    const sealJaAvisado = await wasNearingExpiryNotified(
      admin,
      "selo_expirando_em_breve",
      id,
      SEAL_WARNING_WINDOW_DAYS,
      now
    );
    if (sealJaAvisado) continue;

    await enqueueNotification({
      type: "selo_expirando_em_breve",
      payload: { businessId: id, seloValidoAte: business.selo_valido_ate },
      destinatarioId: business.owner_id,
      email: {
        subject: "Îasy - seu selo Verificado Îasy expira em breve",
        body: `Faltam 30 dias para o selo Verificado Îasy de ${business.nome ?? "seu negócio"} expirar. Entre em contato para renovar a verificação.`,
      },
    });
    selosAvisados += 1;
  }

  if (expiredSealIds.length > 0) {
    assertTransition("verificado", "expirado");
    await admin.from("businesses").update({ status: "expirado" }).in("id", expiredSealIds);
  }

  return NextResponse.json({
    ok: true,
    expired: {
      rascunhos: expiredDraftIds.length,
      pedidosDocumento: expiredRequestIds.length,
      acessosDocumento: expiredAccessIds.length,
      interesses: expiredInterestIds.length,
      selos: expiredSealIds.length,
    },
    avisados: {
      rascunhos: rascunhosAvisados,
      selos: selosAvisados,
    },
  });
}
