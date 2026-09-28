import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * RN-07/CA-07.3: apaga rascunhos (negocios em status "rascunho") sem
 * atividade ha 90 dias. "Atividade" e' a revisao mais recente em
 * business_revisions, ou a criacao do negocio se ele nunca teve nenhuma
 * parte salva.
 *
 * TODO(T53): antes de apagar, enfileirar o aviso "faltam 7 dias" via
 * lib/notifications/queue.ts para rascunhos entre 83 e 90 dias sem
 * atividade (a fila de notificacoes so' existe a partir do T53).
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoff = Date.now() - NINETY_DAYS_MS;

  const { data: drafts, error: draftsError } = await admin
    .from("businesses")
    .select("id, created_at")
    .eq("status", "rascunho");

  if (draftsError) {
    return NextResponse.json({ error: draftsError.message }, { status: 500 });
  }

  const expiredIds: string[] = [];

  for (const draft of drafts ?? []) {
    const { data: lastRevision } = await admin
      .from("business_revisions")
      .select("created_at")
      .eq("business_id", draft.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastActivity = new Date(
      lastRevision?.created_at ?? draft.created_at
    ).getTime();

    if (lastActivity < cutoff) {
      expiredIds.push(draft.id);
    }
  }

  if (expiredIds.length > 0) {
    await admin.from("businesses").delete().in("id", expiredIds);
  }

  return NextResponse.json({ ok: true, expired: expiredIds.length });
}
