import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveBusinessForOwner, getDraftData } from "@/lib/business/draft";
import { PartHeader } from "@/components/cadastro/PartHeader";
import { Parte3Form } from "./parte3-form";

/** RF-08/RN-06: Parte 3 do cadastro do produtor - Sua produção. */
export default async function CadastroParte3Page() {
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
      <PartHeader part={3} title="Sua produção" />
      <Parte3Form draft={draft.part3} />
    </main>
  );
}
