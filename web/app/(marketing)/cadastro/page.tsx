import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { postAuthDestination } from "@/lib/auth/post-auth-server";
import { isValidRole } from "@/lib/auth/role-options";
import { CadastroForm } from "./cadastro-form";

export default async function CadastroPage(props: PageProps<"/cadastro">) {
  const searchParams = await props.searchParams;
  const perfil = typeof searchParams.perfil === "string" ? searchParams.perfil : "";

  // Quem ja esta logado nao ve o formulario (AUTH-01.9).
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(await postAuthDestination(user.id));

  // AUTH-02.2: `?perfil=` so' pre-seleciona um perfil valido.
  return <CadastroForm initialRole={isValidRole(perfil) ? perfil : null} />;
}
