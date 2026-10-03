import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { RedefinirSenhaForm } from "./redefinir-senha-form";

export default async function RedefinirSenhaPage() {
  // AUTH-14.10: so' abre com sessao (de recuperacao ou normal).
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/esqueci-senha");

  return <RedefinirSenhaForm />;
}
