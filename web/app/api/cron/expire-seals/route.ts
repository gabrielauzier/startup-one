import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTransition } from "@/lib/business/state-machine";
import { selectSealsNearingExpiry } from "@/lib/cron/expiration";
import { enqueueNotification, wasNearingExpiryNotified } from "@/lib/notifications/queue";

// Gap 3 (Minor, rodada 2): janela de 30 dias de largura - conferir se
// ja' avisou nos ultimos 30 dias evita repetir o aviso em todo cron
// diario dentro da mesma janela.
const SEAL_WARNING_WINDOW_DAYS = 30;

/**
 * RN-19/CA-19.2: move negocios `verificado` cujo `selo_valido_ate` ja
 * passou para `expirado` (RN-12 permite verificado -> expirado). So'
 * seleciona negocios com `status='verificado'`, entao rodar 2x no
 * mesmo dia e' idempotente - depois da 1a passada, ja nao ha mais
 * `verificado` vencido para mover. Antes disso, avisa o produtor
 * (CA-19.2: "faltam 30 dias") os negocios cujo selo ainda nao venceu
 * mas vence dentro de 30 dias - `selo_expirando_em_breve` (Fix 5,
 * rodada 1 do Verifier; ate' entao TODO(T53), pois RF-31 nao tinha
 * esse tipo).
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
    .select("id, selo_valido_ate, owner_id, nome")
    .eq("status", "verificado");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const expiredIds = (verificados ?? [])
    .filter((b) => b.selo_valido_ate && new Date(b.selo_valido_ate) < now)
    .map((b) => b.id);

  const nearingExpiryIds = selectSealsNearingExpiry(
    (verificados ?? []).map((b) => ({ id: b.id, seloValidoAte: b.selo_valido_ate })),
    now
  );

  const byId = new Map((verificados ?? []).map((b) => [b.id, b]));
  let avisados = 0;
  for (const id of nearingExpiryIds) {
    const business = byId.get(id);
    if (!business) continue;

    const jaAvisado = await wasNearingExpiryNotified(
      admin,
      "selo_expirando_em_breve",
      id,
      SEAL_WARNING_WINDOW_DAYS,
      now
    );
    if (jaAvisado) continue;

    await enqueueNotification({
      type: "selo_expirando_em_breve",
      payload: { businessId: id, seloValidoAte: business.selo_valido_ate },
      destinatarioId: business.owner_id,
      email: {
        subject: "Îasy - seu selo Verificado Îasy expira em breve",
        body: `Faltam 30 dias para o selo Verificado Îasy de ${business.nome ?? "seu negócio"} expirar. Entre em contato para renovar a verificação.`,
      },
    });
    avisados += 1;
  }

  if (expiredIds.length > 0) {
    assertTransition("verificado", "expirado");
    await admin.from("businesses").update({ status: "expirado" }).in("id", expiredIds);
  }

  return NextResponse.json({ ok: true, expired: expiredIds.length, avisados });
}
