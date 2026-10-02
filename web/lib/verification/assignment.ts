const LOCK_MS = 24 * 60 * 60 * 1000;

export interface AssignmentState {
  assignedTo: string | null;
  assignedAt: string | null;
}

/**
 * RN-17/CA-17.1: ao abrir um item da fila, ele fica com o verificador
 * por 24 horas. Outro verificador nao consegue assumir (nem decidir)
 * enquanto a trava estiver ativa; o mesmo verificador pode reabrir o
 * proprio item a qualquer momento (renova a posse, nao bloqueia a si
 * mesmo).
 */
export function canAssign(
  state: AssignmentState,
  verifierId: string,
  now: Date
): boolean {
  if (!state.assignedTo || !state.assignedAt) return true;
  if (state.assignedTo === verifierId) return true;

  const elapsed = now.getTime() - new Date(state.assignedAt).getTime();
  return elapsed >= LOCK_MS;
}
