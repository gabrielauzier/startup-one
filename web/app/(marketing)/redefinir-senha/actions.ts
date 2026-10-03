"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics/track";
import { clearRecoveryFlag } from "@/lib/auth/auth-context-cookie";
import { postAuthDestination } from "@/lib/auth/post-auth-server";
import { passwordRequirementMessage, validatePassword } from "@/lib/auth/password";

export interface SetPasswordState {
  error?: string;
  passwordError?: string;
  confirmError?: string;
}

const SAME_PASSWORD = "Escolha uma senha diferente da atual.";
const FAILED = "Não foi possível alterar a senha. Tente de novo.";

/**
 * AUTH-14: define a nova senha (sessao de recuperacao ou logado). Em
 * sucesso encerra as demais sessoes, solta a restricao de recuperacao e
 * segue o destino pos-autenticacao com o aviso "senha alterada".
 */
export async function setNewPassword(
  _prev: SetPasswordState,
  formData: FormData
): Promise<SetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const check = validatePassword(password);
  const passwordError = check.ok ? undefined : passwordRequirementMessage(check.missing);
  const confirmError = password === confirm ? undefined : "As senhas não são iguais.";
  if (passwordError || confirmError) return { passwordError, confirmError };

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/esqueci-senha");

  const { error } = await supabase.auth.updateUser({
    password,
    data: { has_password: true },
  });
  if (error) {
    if (error.code === "same_password") return { passwordError: SAME_PASSWORD };
    if (error.code === "weak_password") {
      return { passwordError: passwordRequirementMessage(check.missing) || FAILED };
    }
    return { error: FAILED };
  }

  await supabase.auth.signOut({ scope: "others" });
  await clearRecoveryFlag();

  try {
    await trackEvent({ type: "auth_senha_alterada", payload: {}, atorId: user.id });
  } catch {
    // Telemetria nunca bloqueia o fluxo (AUTH-15.4).
  }

  const destination = await postAuthDestination(user.id);
  redirect(`${destination}${destination.includes("?") ? "&" : "?"}aviso=senha-alterada`);
}
