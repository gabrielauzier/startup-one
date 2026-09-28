import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveBusinessForOwner, getDraftData } from "@/lib/business/draft";
import { RevisarForm } from "./revisar-form";

/**
 * RF-12/RF-13/RN-14: resumo do cadastro antes do envio. A mesma tela
 * serve para o fluxo de Ajuste solicitado - quando `business.status`
 * for `ajuste_solicitado`, um aviso é mostrado no topo (o modelo
 * granular de "quais campos foram marcados pelo verificador, com
 * comentário" chega junto da tabela `verifications`, na Fase 5/T25+;
 * aqui os campos já ficam preparados para receber essa marcação).
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

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <p className="font-body text-sm text-foreground/70">Revisar e enviar</p>
        <h1 className="mt-2 font-heading text-2xl text-primary">
          Confira seu cadastro
        </h1>
      </div>

      {business.status === "ajuste_solicitado" && (
        <p className="rounded-md bg-muted px-4 py-3 font-body text-sm text-foreground/80">
          A equipe pediu um ajuste no seu cadastro. Corrija o que for
          necessário e reenvie para análise.
        </p>
      )}

      <RevisarForm
        businessId={business.id}
        draft={draft}
        evidenceCounts={evidenceCounts}
      />
    </main>
  );
}
