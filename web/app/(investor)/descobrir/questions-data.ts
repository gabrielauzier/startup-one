/**
 * RN-22: opcoes literais das 5 perguntas da descoberta guiada.
 *
 * NOTA/SPEC_DEVIATION: a lista de impactos usada aqui (pergunta 5,
 * `DISCOVERY_IMPACT_OPTIONS`) e' a lista literal de RN-22, e e'
 * DIFERENTE da lista de impactos que o produtor marca no cadastro
 * (`lib/business/impact-options.ts`, `IMPACT_OPTIONS`, criada no T21
 * quando a PRD parecia so' citar exemplos). RN-24 (o calculo de
 * alinhamento) compara os impactos do investidor com os do negocio por
 * igualdade de texto - com listas diferentes, a intersecao real
 * (impactos "em comum") sera' menor do que poderia ser em producao.
 * Fora do escopo deste lote (T31-T38) reconciliar as duas listas, ja'
 * que T21 esta' commitado e fechado desde a Fase 4; registrado aqui
 * para uma correcao futura (unificar as duas em `lib/business/impact-options.ts`
 * e migrar os dados ja' gravados).
 */

export const PRIORIDADE_OPTIONS = [
  { value: "impacto", label: "Impacto primeiro" },
  { value: "retorno", label: "Retorno primeiro" },
  { value: "pessoas", label: "As pessoas primeiro" },
  { value: "equilibrio", label: "Equilíbrio" },
] as const;

export const FAIXA_VALOR_OPTIONS = [
  { value: "ate_50k", label: "Até R$ 50 mil" },
  { value: "50_200k", label: "R$ 50 a 200 mil" },
  { value: "acima_200k", label: "Acima de R$ 200 mil" },
] as const;

/** Pergunta 3 - categorias de produto (RN-22); "Todos" e' tratado à parte. */
export const PRODUTO_OPTIONS = [
  "Alimentos",
  "Cosméticos",
  "Óleos vegetais",
  "Castanha",
  "Cacau",
] as const;

export const TODOS_PRODUTOS = "Todos";

export const PRAZO_OPTIONS = [18, 24, 36] as const;

export const DISCOVERY_IMPACT_OPTIONS = [
  "Floresta em pé",
  "Renda para as famílias",
  "Mulheres na liderança",
  "Comunidades tradicionais",
  "Colheita que preserva a mata",
  "Saber de onde vem o produto",
  "Jovens no campo",
] as const;
