/**
 * RN-18: os 5 itens que o verificador precisa conferir antes de poder
 * Aprovar. As chaves batem 1:1 com o `checklist` jsonb gravado em
 * `verifications` (T25).
 */
export const CHECKLIST_ITEMS = [
  "cnpj_ativo",
  "documento_terra_legivel",
  "fotos_compativeis",
  "producao_coerente",
  "praticas_plausiveis",
] as const;

export type ChecklistKey = (typeof CHECKLIST_ITEMS)[number];
export type ChecklistState = Record<ChecklistKey, boolean>;

export function emptyChecklist(): ChecklistState {
  return Object.fromEntries(CHECKLIST_ITEMS.map((key) => [key, false])) as ChecklistState;
}

/** RN-18/CA-18.1: Aprovar exige todos os itens do checklist conferidos. */
export function isChecklistComplete(checklist: ChecklistState): boolean {
  return CHECKLIST_ITEMS.every((key) => checklist[key] === true);
}

/** RN-18: Pedir ajuste/Reprovar exigem motivo com ao menos 20 caracteres. */
export function isValidMotivo(motivo: string): boolean {
  return motivo.trim().length >= 20;
}
