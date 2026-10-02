/**
 * RN-05/CA-05.2: o piloto atende so a Amazonia Legal. A lista oficial do
 * IBGE tem ~772 municipios; para o escopo do MVP, validar por UF (os 9
 * estados que compoem a Amazonia Legal) e' suficiente e testavel sem
 * carregar a lista completa de municipios - documentado aqui como
 * simplificacao deliberada, nao um gap.
 */
export const AMAZONIA_LEGAL_UFS = [
  "AC",
  "AP",
  "AM",
  "MA",
  "MT",
  "PA",
  "RO",
  "RR",
  "TO",
] as const;

export type AmazoniaLegalUf = (typeof AMAZONIA_LEGAL_UFS)[number];

export function isInAmazoniaLegal(uf: string): boolean {
  return (AMAZONIA_LEGAL_UFS as readonly string[]).includes(uf.toUpperCase());
}

/**
 * Gap de design (PRO-03): o campo "Estado" vira um dropdown no
 * cadastro. Precisa listar as 27 UFs (não só as 9 da Amazônia Legal) -
 * o piloto aceita o cadastro de qualquer estado e só avisa depois,
 * via `isInAmazoniaLegal`, que está fora do escopo (RN-05/CA-05.2).
 */
export const BRAZIL_UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;
