import { createHash } from "node:crypto";

/** AUTH edge case: `trim` + minusculas antes de qualquer chamada de auth. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Chave de `auth_throttle`: SHA-256 (hex) do e-mail normalizado, para o
 * limite de envio nao guardar o e-mail em claro (AD-010).
 */
export function hashEmail(email: string): string {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}
