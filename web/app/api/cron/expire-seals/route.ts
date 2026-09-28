import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTransition } from "@/lib/business/state-machine";

/**
 * RN-19/CA-19.2: move negocios `verificado` cujo `selo_valido_ate` ja
 * passou para `expirado` (RN-12 permite verificado -> expirado). So'
 * seleciona negocios com `status='verificado'`, entao rodar 2x no
 * mesmo dia e' idempotente - depois da 1a passada, ja nao ha mais
 * `verificado` vencido para mover.
 *
 * TODO(T53): antes de expirar, enfileirar o aviso "faltam 30 dias" via
 * lib/notifications/queue.ts (a fila so' existe a partir do T53).
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  const { data: verificados, error: fetchError } = await admin
    .from("businesses")
    .select("id, selo_valido_ate")
    .eq("status", "verificado");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const expiredIds = (verificados ?? [])
    .filter((b) => b.selo_valido_ate && new Date(b.selo_valido_ate) < now)
    .map((b) => b.id);

  if (expiredIds.length > 0) {
    assertTransition("verificado", "expirado");
    await admin.from("businesses").update({ status: "expirado" }).in("id", expiredIds);
  }

  return NextResponse.json({ ok: true, expired: expiredIds.length });
}
