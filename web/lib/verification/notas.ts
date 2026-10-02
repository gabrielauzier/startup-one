/**
 * RN-19/CA-19.1: as 3 notas Îasy (Ambiental, Social, Gestão) sao
 * sempre inteiras de 0 a 100. Reforça em TypeScript, antes de qualquer
 * escrita no banco, o mesmo `CHECK` que já existe em `businesses`
 * desde o T13 (nota = trunc(nota) and nota between 0 and 100).
 */
export function isValidNota(nota: number): boolean {
  return Number.isFinite(nota) && Number.isInteger(nota) && nota >= 0 && nota <= 100;
}

export function validateNotas(
  notaA: number,
  notaS: number,
  notaG: number
): { ok: true } | { ok: false; error: string } {
  if (![notaA, notaS, notaG].every(isValidNota)) {
    return { ok: false, error: "As notas precisam ser números inteiros entre 0 e 100." };
  }
  return { ok: true };
}

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

/** RN-19: o selo "Verificado Îasy" vale 12 meses a partir da aprovação. */
export function seloValidoAte(verificadoEm: Date): Date {
  return new Date(verificadoEm.getTime() + TWELVE_MONTHS_MS);
}
