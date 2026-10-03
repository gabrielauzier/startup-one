import { firstParam } from "@/lib/auth/redirect";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { postAuthDestination } from "@/lib/auth/post-auth-server";
import { CompletarPerfilForm } from "./completar-perfil-form";

export default async function CompletarPerfilPage(props: PageProps<"/completar-perfil">) {
  const searchParams = await props.searchParams;
  const redirectTo = firstParam(searchParams.redirect);

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile) redirect(await postAuthDestination(user.id, redirectTo));

  return <CompletarPerfilForm redirectTo={redirectTo} />;
}
