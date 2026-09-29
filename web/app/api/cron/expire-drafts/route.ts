import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { selectExpiredDrafts, selectDraftsNearingExpiry } from "@/lib/cron/expiration";
import { enqueueNotification } from "@/lib/notifications/queue";

/**
 * RN-07/CA-07.3: apaga rascunhos (negocios em status "rascunho") sem
 * atividade ha 90 dias. "Atividade" e' a revisao mais recente em
 * business_revisions, ou a criacao do negocio se ele nunca teve nenhuma
 * parte salva. Antes de apagar, avisa o produtor (CA-07.3: "faltam 7
 * dias") os rascunhos que ainda nao expiraram mas ja passaram de 83
 * dias sem atividade - `rascunho_expirando_em_breve` (Fix 5, rodada 1
 * do Verifier; ate' entao TODO(T53), pois RF-31 nao tinha esse tipo).
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: drafts, error: draftsError } = await admin
    .from("businesses")
    .select("id, created_at, owner_id, nome")
    .eq("status", "rascunho");

  if (draftsError) {
    return NextResponse.json({ error: draftsError.message }, { status: 500 });
  }

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

  const expiredIds = selectExpiredDrafts(draftRows, now);
  const nearingExpiryIds = selectDraftsNearingExpiry(draftRows, now);

  const byId = new Map((drafts ?? []).map((d) => [d.id, d]));
  for (const id of nearingExpiryIds) {
    const draft = byId.get(id);
    if (!draft) continue;

    await enqueueNotification({
      type: "rascunho_expirando_em_breve",
      payload: { businessId: id },
      destinatarioId: draft.owner_id,
      email: {
        subject: "Îasy - seu rascunho de cadastro expira em breve",
        body: `Faltam 7 dias para apagarmos o rascunho de ${draft.nome ?? "seu negócio"} por inatividade. Continue de onde parou para não perder o que já foi preenchido.`,
      },
    });
  }

  if (expiredIds.length > 0) {
    await admin.from("businesses").delete().in("id", expiredIds);
  }

  return NextResponse.json({ ok: true, expired: expiredIds.length, avisados: nearingExpiryIds.length });
}
