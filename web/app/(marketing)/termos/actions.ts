"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  isSafeRedirect,
  resolvePostLoginRedirect,
  type ProfileRole,
} from "@/app/(marketing)/entrar/redirect";

// RN-03: versao dos Termos de Uso e Politica de Privacidade vigente.
// Mudar este valor faz o investidor aceitar de novo no proximo acesso.
const TERMS_VERSION = "2026-09-28";

export interface AcceptTermsState {
  error?: string;
}

/**
 * RF-04/RN-03: grava a versao aceita e o carimbo de data/hora no
 * profile do usuario logado, e segue para a URL original (CA-02.3) ou
 * para o destino padrao do papel (RF-03).
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

  if (isSafeRedirect(redirectTo)) {
    redirect(redirectTo);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as ProfileRole | undefined) ?? "investidor";
  const admin = createAdminClient();
  redirect(await resolvePostLoginRedirect(admin, user.id, role));
}
