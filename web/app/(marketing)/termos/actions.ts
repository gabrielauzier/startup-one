"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { postAuthDestination } from "@/lib/auth/post-auth-server";

// RN-03: versao dos Termos de Uso e Politica de Privacidade vigente.
// Mudar este valor faz o investidor aceitar de novo no proximo acesso.
const TERMS_VERSION = "2026-09-28";

export interface AcceptTermsState {
  error?: string;
}

/**
 * RF-04/RN-03: grava a versao aceita e o carimbo de data/hora no
 * profile do usuario logado, e segue para a URL original (CA-02.3) se o
 * papel puder acessa-la, ou para o destino padrao do papel (RF-03).
 */
export async function acceptTerms(
  _prevState: AcceptTermsState,
  formData: FormData
): Promise<AcceptTermsState> {
  const redirectTo = String(formData.get("redirect") ?? "");

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  await supabase
    .from("profiles")
    .update({
      termos_versao: TERMS_VERSION,
      termos_aceitos_em: new Date().toISOString(),
    })
    .eq("id", user.id);

  // AUTH-01: o destino pedido so' vale se o papel puder acessa-lo (RN-56);
  // senao, o destino padrao do papel.
  redirect(await postAuthDestination(user.id, redirectTo));
}
