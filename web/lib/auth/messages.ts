import type { ThrottleResult } from "./throttle";

export const SEND_FAILED = "Não foi possível enviar o e-mail. Tente de novo.";

/** Texto do bloqueio de envio (cooldown de 60 s ou teto de 3 por hora). */
export function throttleMessage(result: Extract<ThrottleResult, { allowed: false }>): string {
  if (result.reason === "hourly-cap") {
    return "Muitos pedidos. Tente de novo em alguns minutos.";
  }
  return `Aguarde ${result.retryAfterSec} s para pedir de novo.`;
}
