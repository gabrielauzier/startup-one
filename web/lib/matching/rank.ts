/**
 * RN-24: "Os resultados são ordenados pelo alinhamento, com empate
 * decidido pela média das notas e depois pela verificação mais
 * recente". Funcao pura de ordenacao, separada de `score.ts` porque
 * ordena uma lista (nao calcula 1 numero) e e' consumida so' pela
 * tela de resultados (T36).
 */
export interface RankableBusiness {
  alignment: number;
  notaA: number;
  notaS: number;
  notaG: number;
  /** ISO 8601, ou `null` se nunca verificado. */
  verificadoEm: string | null;
}

export function sortByAlignment<T extends RankableBusiness>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (b.alignment !== a.alignment) return b.alignment - a.alignment;

    const mediaA = (a.notaA + a.notaS + a.notaG) / 3;
    const mediaB = (b.notaA + b.notaS + b.notaG) / 3;
    if (mediaB !== mediaA) return mediaB - mediaA;

    const dataA = a.verificadoEm ? new Date(a.verificadoEm).getTime() : 0;
    const dataB = b.verificadoEm ? new Date(b.verificadoEm).getTime() : 0;
    return dataB - dataA;
  });
}
