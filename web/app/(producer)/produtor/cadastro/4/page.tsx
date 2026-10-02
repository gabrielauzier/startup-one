import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveBusinessForOwner } from "@/lib/business/draft";
import { listEvidences } from "./actions";
import { Parte4Form } from "./parte4-form";

/** RF-09/RN-08/RN-09: Parte 4 do cadastro do produtor - Fotos e documentos. */
export default async function CadastroParte4Page() {
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

  const evidences = await listEvidences(business.id);
  const counts = {
    onde_produz: evidences.filter((e) => e.grupo === "onde_produz").length,
    produto: evidences.filter((e) => e.grupo === "produto").length,
    terra: evidences.filter((e) => e.grupo === "terra").length,
    selo: evidences.filter((e) => e.grupo === "selo").length,
  };

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-12">
      <Parte4Form businessId={business.id} counts={counts} />
    </main>
  );
}
