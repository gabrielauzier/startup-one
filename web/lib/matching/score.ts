/**
 * RN-24: calculo do alinhamento (0-100%) entre as respostas do
 * investidor na descoberta guiada (`/descobrir/[n]`) e um negocio
 * verificado. Funcao pura server-side (AD-003, design.md "Decisao #3")
 * - nunca roda no client, para nao vazar a formula de pontuacao no
 * bundle, e para poder ser testada isoladamente (RNF-12).
 */

export type Prioridade = "impacto" | "retorno" | "pessoas" | "equilibrio";
export type FaixaValor = "ate_50k" | "50_200k" | "acima_200k";

export interface InvestorAnswers {
  /** Pergunta 1: "O que pesa mais" (RN-22). */
  prioridade: Prioridade;
  /** Pergunta 2: faixa de valor que o investidor busca colocar. */
  faixaValor: FaixaValor;
  /** Pergunta 3: categorias de produto escolhidas, ou `["todos"]`. */
  produtos: string[];
  /** Pergunta 4: prazo maximo aceito, em meses. */
  prazoMaxMeses: number;
  /**
   * Pergunta 5 (opcional): impactos escolhidos. `undefined` ou `[]`
   * significa "Pular esta pergunta" (CA-22.3) - vale 8 pontos fixos
   * para todos os negocios, por RN-24.
   */
  impactos?: string[];
}

export interface BusinessForMatching {
  /** Produtos do negocio, como cadastrados na Parte 3 (RF-08). */
  produtos: string[];
  /** "Busca R$ X" (RN-10). */
  valorBusca: number;
  /** Prazo em meses (12|18|24|36). */
  prazoMeses: number;
  /** Impactos marcados pelo produtor. */
  impactos: string[];
  /** Notas Iasy (RN-19) - podem ser `null` se ainda nao verificado. */
  notaA: number | null;
  notaS: number | null;
  notaG: number | null;
}

const PESO_PRODUTO = 30;
const PESO_VALOR = 25;
const PESO_PRAZO = 20;
const PESO_IMPACTO = 15;
const PESO_PRIORIDADE = 10;

/** RN-24: "Açaí e Cupuaçu contam como Alimentos; Cacau como Cacau e
 * Alimentos; Castanha como Castanha e Alimentos; Andiroba e Copaíba
 * como Óleos vegetais e Cosméticos". Um produto fora desta tabela
 * (ex.: "Outro", de lib/business/impact-options.ts) conta como a
 * propria categoria - fallback generico para nao quebrar silenciosamente
 * quando um produto novo aparece.
 */
const PRODUCT_CATEGORIES: Record<string, string[]> = {
  Açaí: ["Alimentos"],
  Cupuaçu: ["Alimentos"],
  Cacau: ["Cacau", "Alimentos"],
  Castanha: ["Castanha", "Alimentos"],
  Andiroba: ["Óleos vegetais", "Cosméticos"],
  Copaíba: ["Óleos vegetais", "Cosméticos"],
};

function categoriesOf(produto: string): string[] {
  return PRODUCT_CATEGORIES[produto] ?? [produto];
}

/** 30 se algum produto do negocio esta numa categoria escolhida (ou "Todos"). */
function produtoScore(investorProdutos: string[], businessProdutos: string[]): number {
  if (investorProdutos.some((p) => p.toLowerCase() === "todos")) {
    return PESO_PRODUTO;
  }
  const escolhidas = new Set(investorProdutos);
  const match = businessProdutos.some((produto) =>
    categoriesOf(produto).some((categoria) => escolhidas.has(categoria))
  );
  return match ? PESO_PRODUTO : 0;
}

const FAIXA_ORDER: FaixaValor[] = ["ate_50k", "50_200k", "acima_200k"];

function faixaOf(valor: number): FaixaValor {
  if (valor <= 50_000) return "ate_50k";
  if (valor <= 200_000) return "50_200k";
  return "acima_200k";
}

/** 25 na faixa escolhida; 10 na faixa vizinha; 0 nos demais casos. */
function valorScore(faixaEscolhida: FaixaValor, valorBusca: number): number {
  const faixaNegocio = faixaOf(valorBusca);
  if (faixaNegocio === faixaEscolhida) return PESO_VALOR;
  const distancia = Math.abs(
    FAIXA_ORDER.indexOf(faixaNegocio) - FAIXA_ORDER.indexOf(faixaEscolhida)
  );
  return distancia === 1 ? 10 : 0;
}

/** 20 se o prazo do negocio e' <= o aceito; 8 se passa em ate 12 meses; 0 senao. */
function prazoScore(prazoMaxAceito: number, prazoNegocio: number): number {
  if (prazoNegocio <= prazoMaxAceito) return PESO_PRAZO;
  if (prazoNegocio <= prazoMaxAceito + 12) return 8;
  return 0;
}

/** 15 x (impactos em comum / impactos escolhidos); pergunta pulada vale 8. */
function impactoScore(escolhidos: string[] | undefined, negocioImpactos: string[]): number {
  if (!escolhidos || escolhidos.length === 0) return 8;
  const comuns = negocioImpactos.filter((impacto) => escolhidos.includes(impacto)).length;
  return PESO_IMPACTO * (comuns / escolhidos.length);
}

/** 10 x nota / 100, usando a nota correspondente a' prioridade (ou a media). */
function prioridadeScore(
  prioridade: Prioridade,
  notas: { notaA: number | null; notaS: number | null; notaG: number | null }
): number {
  const notaA = notas.notaA ?? 0;
  const notaS = notas.notaS ?? 0;
  const notaG = notas.notaG ?? 0;

  let nota: number;
  switch (prioridade) {
    case "impacto":
      nota = notaA;
      break;
    case "pessoas":
      nota = notaS;
      break;
    case "retorno":
      nota = notaG;
      break;
    case "equilibrio":
      nota = (notaA + notaS + notaG) / 3;
      break;
  }
  return PESO_PRIORIDADE * (nota / 100);
}

/**
 * Calcula o % de alinhamento (inteiro, 0-100) entre as respostas do
 * investidor e um negocio. Funcao pura: mesma entrada sempre produz a
 * mesma saida (CA-24.3), sem ler relogio, banco ou qualquer estado
 * externo, e sem mutar os parametros recebidos.
 */
export function calculateAlignment(
  answers: InvestorAnswers,
  business: BusinessForMatching
): number {
  const total =
    produtoScore(answers.produtos, business.produtos) +
    valorScore(answers.faixaValor, business.valorBusca) +
    prazoScore(answers.prazoMaxMeses, business.prazoMeses) +
    impactoScore(answers.impactos, business.impactos) +
    prioridadeScore(answers.prioridade, business);

  return Math.round(total);
}
