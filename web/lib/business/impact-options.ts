/**
 * RF-08: as 7 opções de impacto sao as mesmas usadas na parte 3 do
 * cadastro do produtor e na pergunta 5 da descoberta guiada do
 * investidor (T33+). A PRD nao enumera a lista completa das 7 opcoes,
 * so' cita exemplos ("Floresta em pé", "Renda para as famílias",
 * "Mulheres na liderança") - lista definida aqui, documentada como
 * SPEC_DEVIATION/assumption na task T21 de tasks.md, para ser
 * reutilizada sem divergencia quando a descoberta (T33) for
 * implementada.
 */
export const IMPACT_OPTIONS = [
  "Floresta em pé",
  "Renda para as famílias",
  "Mulheres na liderança",
  "Segurança alimentar",
  "Recuperação de área degradada",
  "Geração de emprego local",
  "Preservação de conhecimento tradicional",
] as const;

export const PRODUTOS_OPTIONS = [
  "Açaí",
  "Cacau",
  "Castanha",
  "Cupuaçu",
  "Andiroba",
  "Copaíba",
  "Outro",
] as const;

/** RN-30/CA-30.1: praticas de cuidado com a floresta - comecam desmarcadas. */
export const PRACTICE_OPTIONS = [
  "Colhemos sem derrubar a mata",
  "Não usamos agrotóxicos",
  "Recuperamos áreas degradadas",
  "Protegemos nascentes e rios",
  "Fazemos rotação da área de manejo",
  "Reflorestamento",
  "Não usamos fogo no preparo da área",
] as const;
