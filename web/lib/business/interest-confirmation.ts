/**
 * RN-38/CA-38.1/CA-38.2: texto exato de confirmação que o investidor
 * aceita ao enviar um interesse - fixado no servidor (nunca recebido
 * do client) para que a linha gravada em `interests.confirmacao_texto`
 * não possa ser adulterada por quem chama `createInterest` fora da UI
 * (`app/(investor)/negocios/[slug]/actions.ts`). O modal
 * (`InterestModal.tsx`) mostra o mesmo texto na caixa de confirmação
 * para não haver 2 fontes divergentes.
 */
export const INTEREST_CONFIRMATION_TEXT =
  "Entendo que estou demonstrando interesse, e não investindo agora";

/** RN-36: valor mínimo de um interesse (mesmo limite do CHECK em 0008_interests.sql). */
export const INTEREST_MIN_VALOR = 1000;

/** RN-38: tamanho máximo da mensagem opcional. */
export const INTEREST_MAX_MENSAGEM_LENGTH = 500;
