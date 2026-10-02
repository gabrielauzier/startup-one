import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getActiveBusinessForOwner,
  getDraftData,
  getLatestItensAjuste,
} from "@/lib/business/draft";
import { ADJUSTABLE_FIELDS } from "@/lib/business/adjustable-fields";
import { RevisarForm } from "./revisar-form";

/**
 * RF-12/RF-13/RN-14/CA-14.1: resumo do cadastro antes do envio. A
 * mesma tela serve para o fluxo de Ajuste solicitado - quando
 * `business.status` for `ajuste_solicitado`, mostra a lista dos campos
 * marcados pelo verificador com o comentario de cada um (o bloqueio
 * campo a campo em si acontece nas paginas de cada parte - Parte1..5 -
 * via `getAjusteInfoForPart`/`isFieldLocked`).
 */
export default async function RevisarPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const admin = createAdminClient();
  const business = await getActiveBusinessForOwner(admin, user.id);

  if (!business) {
    redirect("/produtor");
  }

  const draft = await getDraftData(admin, business.id);
  const { data: evidenceRows } = await admin
    .from("evidences")
    .select("grupo")
    .eq("business_id", business.id);

  const evidenceCounts = {
    onde_produz: (evidenceRows ?? []).filter((e) => e.grupo === "onde_produz").length,
    produto: (evidenceRows ?? []).filter((e) => e.grupo === "produto").length,
    terra: (evidenceRows ?? []).filter((e) => e.grupo === "terra").length,
    selo: (evidenceRows ?? []).filter((e) => e.grupo === "selo").length,
  };

  const itensAjuste =
    business.status === "ajuste_solicitado"
      ? await getLatestItensAjuste(admin, business.id)
      : [];
  const labelByCampo = new Map(ADJUSTABLE_FIELDS.map((f) => [f.campo, f.label]));

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <p className="font-body text-sm text-foreground/70">Revisar e enviar</p>
        <h1 className="mt-2 font-heading text-2xl text-primary">
          Confira seu cadastro
        </h1>
      </div>

      {business.status === "ajuste_solicitado" && (
        <div
          className="rounded-md bg-muted px-4 py-3 font-body text-sm text-foreground/80"
          data-testid="aviso-ajuste-solicitado"
        >
          <p>
            A equipe pediu um ajuste no seu cadastro. Corrija o que for
            necessário e reenvie para análise.
          </p>
          {itensAjuste.length > 0 && (
            <ul className="mt-2 list-disc pl-5">
              {itensAjuste.map((item) => (
                <li key={item.campo} data-testid={`ajuste-resumo-${item.campo}`}>
                  <span className="font-medium">
                    {labelByCampo.get(item.campo) ?? item.campo}
                  </span>
                  {item.comentario ? `: ${item.comentario}` : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <RevisarForm
        businessId={business.id}
        draft={draft}
        evidenceCounts={evidenceCounts}
      />
    </main>
  );
}
