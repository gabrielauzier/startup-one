"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics/track";
import { readAuthContext, setRecoveryFlag } from "@/lib/auth/auth-context-cookie";
import { SEND_FAILED, isEmailSendRateLimit, logAuthError, throttleMessage } from "@/lib/auth/messages";
import { checkAndRecordSend } from "@/lib/auth/throttle";

export interface VerifyResetState {
  error?: string;
}

export interface ResendResetState {
  error?: string;
  sent?: boolean;
  retryAfterSec?: number;
}

const INVALID_CODE = "Código inválido ou vencido.";
const TOO_MANY_ATTEMPTS = "Muitas tentativas. Peça um novo código.";

async function track(type: "auth_reset_codigo_ok" | "auth_reset_codigo_erro") {
  try {
    await trackEvent({ type, payload: {} });
  } catch {
    // Telemetria nunca bloqueia o fluxo (AUTH-15.4).
  }
}

/**
 * AUTH-08: confirma o codigo de 6 digitos (`type: "recovery"`). O erro e'
 * unico para errado, vencido, usado ou substituido; o teto de tentativas
 * e' o do GoTrue (429). Sucesso abre a sessao de recuperacao, restrita a
 * /redefinir-senha pela flag `iasy_recovery`.
 */
export async function verifyResetCode(
  _prev: VerifyResetState,
  formData: FormData
): Promise<VerifyResetState> {
  const ctx = await readAuthContext("reset");
  if (!ctx) redirect("/esqueci-senha");

  const token = String(formData.get("code") ?? "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(token)) {
    await track("auth_reset_codigo_erro");
    return { error: INVALID_CODE };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email: ctx.email,
    token,
    type: "recovery",
  });

  if (error || !data.session) {
    await track("auth_reset_codigo_erro");
    if (error?.status === 429 || error?.code === "over_request_rate_limit") {
      return { error: TOO_MANY_ATTEMPTS };
    }
    return { error: INVALID_CODE };
  }

  await track("auth_reset_codigo_ok");
  await setRecoveryFlag();
  redirect("/redefinir-senha");
}

/** AUTH-08 (7) / AUTH-09: novo codigo (invalida o anterior) com cooldown de 60 s. */
export async function resendResetCode(): Promise<ResendResetState> {
  const ctx = await readAuthContext("reset");
  if (!ctx) redirect("/esqueci-senha");

  const throttle = await checkAndRecordSend(ctx.email, "reset");
  if (!throttle.allowed) {
    return { error: throttleMessage(throttle), retryAfterSec: throttle.retryAfterSec };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(ctx.email);
  if (error && !isEmailSendRateLimit(error)) {
    logAuthError("reset.resend", error);
    return { error: SEND_FAILED };
  }

  return { sent: true, retryAfterSec: 60 };
}
