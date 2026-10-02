/**
 * RN-29: "Interesse de investidores: R$ X de R$ Y" soma os valores dos
 * interesses Pendentes e Aceitos do negócio. A barra para em 100% do
 * valor buscado mesmo que a soma passe.
 *
 * NOTA/SPEC_DEVIATION: a tabela `interests` só é criada no T45 (Fase
 * 9, fora deste lote). O shape abaixo (`Interest`) segue exatamente o
 * modelo de dados já definido na PRD (mvp/prd-mvp.md, linha ~570):
 * `interests (id, business_id, investor_id, valor, mensagem, status,
 * confirmacao_texto, confirmado_em)`. Os status usados aqui
 * ("pendente"/"aceito"/"recusado"/"cancelado"/"expirado") seguem a
 * nomenclatura de RN-36 a RN-39 do PRD. A integração real com a
 * tabela e' feita nas tasks do T45 em diante (a query real em
 * `app/(investor)/negocios/[slug]/page.tsx` e no card, ligada no T49);
 * esta task só entrega a função pura de soma, testável isoladamente
 * antes de a tabela existir.
 */

export type InterestStatus = "pendente" | "aceito" | "recusado" | "cancelado" | "expirado";

export interface Interest {
  valor: number;
  status: InterestStatus;
}

export interface InterestSumResult {
  /** Soma bruta dos interesses Pendentes+Aceitos, sem limitar (para o texto "R$ X de R$ Y"). */
  somaAbsoluta: number;
  /** 0-100: percentual da barra visual, limitado a 100 mesmo que a soma passe do valor buscado. */
  percentualBarra: number;
}

const SOMADOS: InterestStatus[] = ["pendente", "aceito"];

/** RN-29: soma interesses Pendentes+Aceitos; recusado/cancelado/expirado saem da soma (CA-29.2). */
export function sumInterests(interests: Interest[], valorBuscado: number): InterestSumResult {
  const somaAbsoluta = interests
    .filter((interest) => SOMADOS.includes(interest.status))
    .reduce((total, interest) => total + interest.valor, 0);

  const percentualBarra =
    valorBuscado > 0 ? Math.min(100, Math.round((somaAbsoluta / valorBuscado) * 100)) : 0;

  return { somaAbsoluta, percentualBarra };
}

function formatMilReais(value: number): string {
  if (value >= 1000 && value % 1000 === 0) {
    return `R$ ${value / 1000} mil`;
  }
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

/** CA-29.1: "R$ 95 mil de R$ 180 mil". */
export function formatInterestSummary(somaAbsoluta: number, valorBuscado: number): string {
  return `${formatMilReais(somaAbsoluta)} de ${formatMilReais(valorBuscado)}`;
}
