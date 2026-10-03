import type { EntrarRole } from "./redirect";

/** Perfis que a interface oferece no cadastro e em "Complete seu perfil" (nunca `verificador`, RN-01). */
export const ROLE_OPTIONS: { value: EntrarRole; label: string }[] = [
  { value: "investidor", label: "Quero investir" },
  { value: "empresa", label: "Represento uma empresa" },
  { value: "produtor", label: "Produzo na Amazônia" },
];

export const VALID_ROLES: EntrarRole[] = ROLE_OPTIONS.map((o) => o.value);

export function isValidRole(value: unknown): value is EntrarRole {
  return typeof value === "string" && (VALID_ROLES as string[]).includes(value);
}

export const NOME_MIN = 2;
export const NOME_MAX = 80;

export function validateNome(raw: string): string | null {
  const nome = raw.trim();
  if (nome.length < NOME_MIN || nome.length > NOME_MAX) {
    return `Informe seu nome com ${NOME_MIN} a ${NOME_MAX} caracteres.`;
  }
  return null;
}
