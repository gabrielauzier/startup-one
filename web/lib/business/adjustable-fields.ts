/**
 * CA-14.1: catalogo dos campos do cadastro que o verificador pode
 * marcar para ajuste (com um comentario cada). `campo` e' namespaced
 * por parte (ex.: "parte2.cidade") para nao colidir entre campos de
 * mesmo nome em partes diferentes (ex.: "nome" existe na Parte 1 -
 * nome da pessoa - e na Parte 2 - nome do negocio).
 */
export interface AdjustableField {
  campo: string;
  label: string;
  part: 1 | 2 | 3 | 5;
}

export const ADJUSTABLE_FIELDS: AdjustableField[] = [
  { campo: "parte1.nome", label: "Seu nome (Parte 1)", part: 1 },
  { campo: "parte1.telefone", label: "Telefone (Parte 1)", part: 1 },
  { campo: "parte1.email", label: "E-mail (Parte 1)", part: 1 },
  { campo: "parte1.cnpj", label: "CNPJ (Parte 1)", part: 1 },
  { campo: "parte2.nome", label: "Nome do negócio (Parte 2)", part: 2 },
  { campo: "parte2.tipoOrg", label: "Tipo de organização (Parte 2)", part: 2 },
  { campo: "parte2.cidade", label: "Cidade (Parte 2)", part: 2 },
  { campo: "parte2.uf", label: "Estado (Parte 2)", part: 2 },
  { campo: "parte2.familias", label: "Número de famílias (Parte 2)", part: 2 },
  { campo: "parte2.anosAtividade", label: "Tempo de atividade (Parte 2)", part: 2 },
  { campo: "parte2.recebeVisitas", label: "Recebe visitas (Parte 2)", part: 2 },
  { campo: "parte3.produtos", label: "Produtos (Parte 3)", part: 3 },
  { campo: "parte3.producaoMensalKg", label: "Produção mensal (Parte 3)", part: 3 },
  { campo: "parte3.praticas", label: "Práticas (Parte 3)", part: 3 },
  { campo: "parte3.impactos", label: "Impactos (Parte 3)", part: 3 },
  { campo: "parte5.finalidade", label: "Finalidade (Parte 5)", part: 5 },
  { campo: "parte5.valorBusca", label: "Valor buscado (Parte 5)", part: 5 },
  { campo: "parte5.prazoMeses", label: "Prazo (Parte 5)", part: 5 },
  { campo: "parte5.retornoProposto", label: "Retorno proposto (Parte 5)", part: 5 },
];

export interface ItemAjuste {
  campo: string;
  comentario: string;
}

/**
 * CA-14.1: informacao de ajuste para um formulario especifico - quais
 * dos seus campos estao liberados para edicao, e o comentario de cada
 * um. `null` quando o negocio nao esta em `ajuste_solicitado` (tudo
 * editavel, comportamento normal do rascunho).
 */
export interface FieldAjusteInfo {
  camposEditaveis: Set<string>;
  comentarios: Record<string, string>;
}

/**
 * Filtra os itens de ajuste (todos os campos, de todas as partes) para
 * os que pertencem a uma parte especifica, e devolve so' o sufixo do
 * campo (sem o prefixo "parteN.") - e' o nome usado nos `Draft`s de
 * cada formulario (ex.: "cidade", nao "parte2.cidade").
 */
export function getFieldAjusteInfoForPart(
  itensAjuste: ItemAjuste[],
  part: 1 | 2 | 3 | 4 | 5
): FieldAjusteInfo {
  const prefix = `parte${part}.`;
  const camposEditaveis = new Set<string>();
  const comentarios: Record<string, string> = {};

  for (const item of itensAjuste) {
    if (item.campo.startsWith(prefix)) {
      const campo = item.campo.slice(prefix.length);
      camposEditaveis.add(campo);
      comentarios[campo] = item.comentario;
    }
  }

  return { camposEditaveis, comentarios };
}
