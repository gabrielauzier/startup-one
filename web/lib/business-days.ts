/**
 * RN-16/CA-16.1: dias uteis (seg-sex, sem feriados no MVP - nao ha
 * calendario de feriados nacional/municipal definido na PRD) decorridos
 * entre a entrada de um negocio na fila e agora. Usado pela fila de
 * verificacao (T26) para colorir os itens: >3 dias uteis em amarelo,
 * >5 em vermelho.
 */
export function businessDaysBetween(from: Date, to: Date): number {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  if (end <= start) return 0;

  let count = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }
  }
  return count;
}

export type QueueUrgency = "normal" | "amarelo" | "vermelho";

/**
 * RN-16/CA-16.1: >3 dias uteis fica amarelo, >5 fica vermelho. Testado
 * exatamente nos limites do AC: 4 dias uteis -> amarelo, 6 -> vermelho.
 */
export function classifyQueueUrgency(businessDays: number): QueueUrgency {
  if (businessDays > 5) return "vermelho";
  if (businessDays > 3) return "amarelo";
  return "normal";
}
