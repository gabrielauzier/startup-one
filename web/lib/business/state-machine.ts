export type BusinessStatus =
  | "rascunho"
  | "em_analise"
  | "ajuste_solicitado"
  | "verificado"
  | "reprovado"
  | "suspenso"
  | "expirado";

/**
 * RN-12: unico ponto que valida transicoes de estado do negocio. Reflete
 * exatamente o diagrama da PRD - nenhuma outra transicao e' permitida.
 */
const ALLOWED_TRANSITIONS: Record<BusinessStatus, BusinessStatus[]> = {
  rascunho: ["em_analise"],
  em_analise: ["ajuste_solicitado", "verificado", "reprovado"],
  ajuste_solicitado: ["em_analise"],
  verificado: ["suspenso", "expirado"],
  reprovado: [],
  suspenso: ["verificado"],
  expirado: ["em_analise"],
};

export function canTransition(from: BusinessStatus, to: BusinessStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export class InvalidBusinessTransitionError extends Error {
  constructor(from: BusinessStatus, to: BusinessStatus) {
    super(`Transição de estado inválida: ${from} -> ${to}`);
    this.name = "InvalidBusinessTransitionError";
  }
}

export function assertTransition(from: BusinessStatus, to: BusinessStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidBusinessTransitionError(from, to);
  }
}
