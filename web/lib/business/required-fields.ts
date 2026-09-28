import type { DraftData } from "./draft";

export interface EvidenceCounts {
  onde_produz: number;
  produto: number;
}

export interface RequiredFieldsResult {
  ok: boolean;
  missing: string[];
}

/**
 * RN-06/RF-12: os campos obrigatorios de cada parte, checados juntos
 * no envio final (T24) - a agregacao das colunas de `businesses` so'
 * acontece aqui, a partir do historico salvo em `business_revisions`
 * por `saveDraftPart` (ver lib/business/draft.ts).
 */
export function validateRequiredFields(
  draft: DraftData,
  evidenceCounts: EvidenceCounts
): RequiredFieldsResult {
  const missing: string[] = [];

  const p1 = draft.part1;
  if (!p1.nome) missing.push("Parte 1: nome");
  if (!p1.telefone) missing.push("Parte 1: telefone");
  if (!p1.cnpj) missing.push("Parte 1: CNPJ");
  if (!p1.autorizacao) missing.push("Parte 1: autorização de uso de dados");

  const p2 = draft.part2;
  if (!p2.nome) missing.push("Parte 2: nome do negócio");
  if (!p2.tipoOrg) missing.push("Parte 2: tipo de organização");
  if (!p2.cidade) missing.push("Parte 2: cidade");
  if (!p2.uf) missing.push("Parte 2: estado");
  if (p2.familias === undefined || p2.familias === null) {
    missing.push("Parte 2: número de famílias");
  }
  if (p2.anosAtividade === undefined || p2.anosAtividade === null) {
    missing.push("Parte 2: tempo de atividade");
  }

  const p3 = draft.part3;
  const produtos = (p3.produtos as string[] | undefined) ?? [];
  const praticas = (p3.praticas as string[] | undefined) ?? [];
  if (produtos.length === 0) missing.push("Parte 3: ao menos 1 produto");
  if (!p3.producaoMensalKg) missing.push("Parte 3: produção mensal");
  if (praticas.length === 0) missing.push("Parte 3: ao menos 1 prática");

  // RN-08: ao menos 1 foto de onde produzem e 1 do produto/colheita.
  if (evidenceCounts.onde_produz === 0) {
    missing.push("Parte 4: foto de onde vocês produzem");
  }
  if (evidenceCounts.produto === 0) {
    missing.push("Parte 4: foto do produto ou da colheita");
  }

  const p5 = draft.part5;
  if (!p5.finalidade) missing.push("Parte 5: finalidade");
  if (!p5.valorBusca) missing.push("Parte 5: valor");
  if (!p5.prazoMeses) missing.push("Parte 5: prazo");
  if (p5.retornoProposto === undefined || p5.retornoProposto === null) {
    missing.push("Parte 5: retorno proposto");
  }

  return { ok: missing.length === 0, missing };
}
