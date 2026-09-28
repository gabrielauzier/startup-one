import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveBusinessForOwner, getDraftData } from "@/lib/business/draft";
import { PartHeader } from "@/components/cadastro/PartHeader";
import { Parte5Form } from "./parte5-form";

/** RF-10/RN-10: Parte 5 do cadastro do produtor - Quanto vocês precisam. */
export default async function CadastroParte5Page() {
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
      <PartHeader part={5} title="Quanto vocês precisam" />
      <Parte5Form draft={draft.part5} />
    </main>
  );
}
