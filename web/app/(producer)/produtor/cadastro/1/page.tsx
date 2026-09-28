import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveBusinessForOwner, getDraftData } from "@/lib/business/draft";
import { PartHeader } from "@/components/cadastro/PartHeader";
import { Parte1Form } from "./parte1-form";

/**
 * RF-06/RN-03/RN-05: Parte 1 do cadastro do produtor - Sobre você.
 */
export default async function CadastroParte1Page() {
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

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-12">
      <PartHeader part={1} title="Sobre você" />
      <Parte1Form draft={draft.part1} />
    </main>
  );
}
