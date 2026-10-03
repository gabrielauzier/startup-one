"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics/track";
import { normalizeEmail } from "@/lib/auth/email";
import { readAuthContext, setAuthContext } from "@/lib/auth/auth-context-cookie";
import { requestOrigin } from "@/lib/auth/origin";
import { isSafeRedirect } from "@/lib/auth/redirect";
import { SEND_FAILED, throttleMessage } from "@/lib/auth/messages";
import { checkAndRecordSend } from "@/lib/auth/throttle";

export interface SendLinkState {
  error?: string;
  /** Reenvio concluido: a tela mostra "Enviamos outro link". */
  sent?: boolean;
  /** Segundos de espera ate poder pedir de novo (alimenta o contador da tela). */
  retryAfterSec?: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function track(type: "auth_magic_link_pedido") {
  try {
    await trackEvent({ type, payload: {} });
  } catch {
    // Telemetria nunca bloqueia o fluxo (AUTH-15.4).
  }
}

/**
 * Envia o magic link. `shouldCreateUser:false`: so' quem ja tem conta
 * recebe; para e-mail sem conta o GoTrue devolve `otp_disabled`, que e'
 * engolido para a resposta ser identica (RN-54).
 */
async function sendMagicLink(email: string, next: string | null): Promise<SendLinkState | null> {
  const throttle = await checkAndRecordSend(email, "magic");
  if (!throttle.allowed) {
    return { error: throttleMessage(throttle), retryAfterSec: throttle.retryAfterSec };
  }

  const supabase = await createServerClient();
  const emailRedirectTo = next ? `${await requestOrigin()}${next}` : undefined;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo },
  });

  if (error && error.code !== "otp_disabled") {
    return { error: SEND_FAILED };
  }

  await track("auth_magic_link_pedido");
  return null;
}

/** AUTH-06: "Receber link de acesso por e-mail" em /entrar. */
export async function requestMagicLink(
  _prev: SendLinkState,
  formData: FormData
): Promise<SendLinkState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const redirectTo = String(formData.get("redirect") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "Informe um e-mail válido." };

  const failure = await sendMagicLink(email, isSafeRedirect(redirectTo) ? redirectTo : null);
  if (failure) return failure;

  await setAuthContext({ email, kind: "magic" });
  redirect("/entrar/link-enviado");
}

/** AUTH-06 (7, 8) / AUTH-09: reenvio em /entrar/link-enviado. */
export async function resendMagicLink(): Promise<SendLinkState> {
  const ctx = await readAuthContext("magic");
  if (!ctx) redirect("/entrar");

  const failure = await sendMagicLink(ctx.email, null);
  if (failure) return failure;

  return { sent: true, retryAfterSec: 60 };
}

/**
 * Reenvio do e-mail de confirmacao do cadastro. Vindo de /entrar (conta
 * nao confirmada) traz `email` no formulario e segue para a tela de
 * "confira seu e-mail"; vindo dessa tela le o e-mail do cookie e fica nela.
 */
export async function resendConfirmation(
  _prev: SendLinkState,
  formData: FormData
): Promise<SendLinkState> {
  const fromForm = normalizeEmail(String(formData.get("email") ?? ""));
  const ctx = fromForm ? null : await readAuthContext("signup");
  const email = fromForm || ctx?.email;
  if (!email) redirect("/cadastro");

  const throttle = await checkAndRecordSend(email, "signup");
  if (!throttle.allowed) {
    return { error: throttleMessage(throttle), retryAfterSec: throttle.retryAfterSec };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) return { error: SEND_FAILED };

  if (fromForm) {
    await setAuthContext({ email, kind: "signup" });
    redirect("/cadastro/confirmar-email");
  }
  return { sent: true, retryAfterSec: 60 };
}
