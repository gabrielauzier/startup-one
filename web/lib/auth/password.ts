export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export type PasswordRequirement = "min" | "max" | "letter" | "digit";

/**
 * RN-52 / AUTH-02: 8 a 72 caracteres (72 e' o limite do bcrypt), com ao
 * menos 1 letra e 1 numero. Mesma regra no cliente e no servidor; o
 * GoTrue repete `letters_digits` (config.toml).
 */
export function validatePassword(pw: string): {
  ok: boolean;
  missing: PasswordRequirement[];
} {
  const missing: PasswordRequirement[] = [];
  if (pw.length < PASSWORD_MIN) missing.push("min");
  if (pw.length > PASSWORD_MAX) missing.push("max");
  if (!/\p{L}/u.test(pw)) missing.push("letter");
  if (!/\d/.test(pw)) missing.push("digit");
  return { ok: missing.length === 0, missing };
}

const MESSAGES: Record<PasswordRequirement, string> = {
  min: `Use ao menos ${PASSWORD_MIN} caracteres.`,
  max: `Use no máximo ${PASSWORD_MAX} caracteres.`,
  letter: "Inclua ao menos 1 letra.",
  digit: "Inclua ao menos 1 número.",
};

export function passwordRequirementMessage(missing: PasswordRequirement[]): string {
  return missing.map((m) => MESSAGES[m]).join(" ");
}
