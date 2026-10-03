"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics/track";
import { normalizeEmail } from "@/lib/auth/email";
import { setAuthContext } from "@/lib/auth/auth-context-cookie";
import { SEND_FAILED, throttleMessage } from "@/lib/auth/messages";
import { checkAndRecordSend } from "@/lib/auth/throttle";

export interface RequestResetState {
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * AUTH-08: pede o codigo de redefinicao. A resposta e' a mesma para
 * e-mail com e sem conta (RN-54): o GoTrue nao envia nada nem devolve
 * erro quando nao ha conta, e o throttle conta so' o hash do e-mail.
 */
export async function requestReset(
  _prev: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!EMAIL_RE.test(email)) return { error: "Informe um e-mail válido." };

  const throttle = await checkAndRecordSend(email, "reset");
  if (!throttle.allowed) return { error: throttleMessage(throttle) };

  const supabase = await createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return { error: SEND_FAILED };

  try {
    await trackEvent({ type: "auth_reset_pedido", payload: {} });
  } catch {
    // Telemetria nunca bloqueia o fluxo (AUTH-15.4).
  }

  await setAuthContext({ email, kind: "reset" });
  redirect("/esqueci-senha/codigo");
}
