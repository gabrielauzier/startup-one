import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { postAuthDestination } from "@/lib/auth/post-auth-server";
import { EsqueciSenhaForm } from "./esqueci-senha-form";

export default async function EsqueciSenhaPage() {
  // Quem ja esta logado nao ve o formulario (AUTH-01.9).
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(await postAuthDestination(user.id));

  return <EsqueciSenhaForm />;
}
