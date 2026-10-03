"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics/track";
import { normalizeEmail } from "@/lib/auth/email";
import { postAuthDestination } from "@/lib/auth/post-auth-server";

export interface SignInState {
  error?: string;
  /** AUTH-05.4: conta existe mas o e-mail ainda nao foi confirmado. */
  unconfirmed?: boolean;
  emailError?: string;
  passwordError?: string;
  email?: string;
}

const INVALID_CREDENTIALS = "E-mail ou senha incorretos.";
const RATE_LIMITED = "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
const UNCONFIRMED = "Confirme seu e-mail para entrar.";

async function track(type: "auth_login_senha_ok" | "auth_login_senha_erro", atorId?: string) {
  try {
    await trackEvent({ type, payload: {}, atorId: atorId ?? null });
  } catch {
    // Telemetria nunca bloqueia o login (AUTH-15.4).
  }
}

/**
 * AUTH-05: entra com e-mail e senha. Credencial invalida (senha errada,
 * e-mail inexistente ou conta do MVP sem senha) devolve sempre a mesma
 * mensagem; depois de entrar, o destino vem de `postAuthDestination`.
 */
export async function signInPassword(
  _prev: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "");

  if (!email) return { email, emailError: "Informe seu e-mail." };
  if (!password) return { email, passwordError: "Informe sua senha." };

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    await track("auth_login_senha_erro");
    if (error?.code === "email_not_confirmed") {
      return { email, unconfirmed: true, error: UNCONFIRMED };
    }
    if (error?.status === 429 || error?.code === "over_request_rate_limit") {
      return { email, error: RATE_LIMITED };
    }
    return { email, error: INVALID_CREDENTIALS };
  }

  await track("auth_login_senha_ok", data.user.id);
  redirect(await postAuthDestination(data.user.id, redirectTo));
}
