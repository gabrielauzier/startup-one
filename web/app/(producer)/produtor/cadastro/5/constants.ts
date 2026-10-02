/**
 * RN-10: limites do valor buscado. Em arquivo separado (sem
 * "use server") porque um módulo "use server" só pode exportar
 * funções assíncronas - qualquer export não-função (como estas
 * constantes) quebra silenciosamente todos os exports do arquivo.
 */
export const VALOR_MIN = 50_000;
export const VALOR_MAX = 200_000;
export const VALOR_STEP = 5_000;
