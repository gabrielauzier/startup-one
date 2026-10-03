import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { postAuthDestination } from "@/lib/auth/post-auth-server";
import { isSafeRedirect } from "@/lib/auth/redirect";
import { resolveAccess } from "@/lib/auth/roles";
import { EntrarForm, type EntrarNotice } from "./entrar-form";

function noticeFor(
  searchParams: Record<string, string | string[] | undefined>,
  redirectTo: string
): EntrarNotice {
  if (searchParams.aviso === "sem-permissao") return "sem-permissao";
  if (searchParams.aviso === "senha-alterada") return "senha-alterada";
  if (searchParams.erro === "link-expirado") return "link-expirado";
  if (isSafeRedirect(redirectTo) && !resolveAccess(redirectTo.split(/[?#]/)[0], null).allowed) {
    return "continuar";
  }
  return null;
}

export default async function EntrarPage(props: PageProps<"/entrar">) {
  const searchParams = await props.searchParams;
  const redirectTo =
    typeof searchParams.redirect === "string" ? searchParams.redirect : "";

  // AUTH-01.9: quem ja esta logado nao ve o formulario.
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(await postAuthDestination(user.id, redirectTo));

  return <EntrarForm redirectTo={redirectTo} notice={noticeFor(searchParams, redirectTo)} />;
}
