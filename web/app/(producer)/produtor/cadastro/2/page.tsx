import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getActiveBusinessForOwner,
  getAjusteInfoForPart,
  getDraftData,
} from "@/lib/business/draft";
import { Parte2Form } from "./parte2-form";

/** RF-07/RN-05: Parte 2 do cadastro do produtor - Seu negócio. */
export default async function CadastroParte2Page() {
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
  const ajuste = await getAjusteInfoForPart(admin, business, 2);

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-12">
      <Parte2Form businessId={business.id} draft={draft.part2} ajuste={ajuste} />
    </main>
  );
}
