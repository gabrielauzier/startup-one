import type { ThrottleResult } from "./throttle";

export const SEND_FAILED = "Não foi possível enviar o e-mail. Tente de novo.";

/** Texto do bloqueio de envio (cooldown de 60 s ou teto de 3 por hora). */
export function throttleMessage(result: Extract<ThrottleResult, { allowed: false }>): string {
  if (result.reason === "hourly-cap") {
    return "Muitos pedidos. Tente de novo em alguns minutos.";
  }
  return `Aguarde ${result.retryAfterSec} s para pedir de novo.`;
}

/**
 * O GoTrue limita o reenvio a 1 por usuario por `max_frequency` e so' o
 * faz para e-mail COM conta (`over_email_send_rate_limit`): devolver esse
 * erro revelaria que a conta existe (RN-54). As actions o tratam como
 * envio bem-sucedido; o cooldown visivel e' o do `auth_throttle`.
 */
export function isEmailSendRateLimit(error: { code?: string } | null | undefined): boolean {
  return error?.code === "over_email_send_rate_limit";
}
