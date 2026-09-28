/**
 * RN-22/RN-23: respostas das 5 perguntas da descoberta guiada,
 * acumuladas parte a parte (cada campo so' existe depois que o
 * investidor passa pela pergunta correspondente). `impactos` e' sempre
 * opcional - vazio/ausente significa pergunta 5 pulada (CA-22.3).
 */

export type Prioridade = "impacto" | "retorno" | "pessoas" | "equilibrio";
export type FaixaValor = "ate_50k" | "50_200k" | "acima_200k";

export interface DiscoveryAnswers {
  prioridade?: Prioridade;
  faixaValor?: FaixaValor;
  produtos?: string[];
  prazoMaxMeses?: number;
  impactos?: string[];
}

export const TOTAL_QUESTIONS = 5;

/**
 * As 4 respostas obrigatorias (prioridade, valor, produto, prazo) - a
 * pergunta 5 (impacto) e' opcional (RN-22) e nao entra aqui.
 */
export function isComplete(
  answers: DiscoveryAnswers
): answers is DiscoveryAnswers & {
  prioridade: Prioridade;
  faixaValor: FaixaValor;
  produtos: string[];
  prazoMaxMeses: number;
} {
  return Boolean(
    answers.prioridade &&
      answers.faixaValor &&
      answers.produtos &&
      answers.produtos.length > 0 &&
      answers.prazoMaxMeses
  );
}
