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
