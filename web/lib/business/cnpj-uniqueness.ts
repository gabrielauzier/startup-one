/**
 * CA-05.3 (Fix 4, rodada 1 do Verifier): so' pode existir um negocio
 * ativo (nao Reprovado/Expirado) por CNPJ - garantido pelo indice
 * unico parcial `businesses_cnpj_ativo_idx`
 * (`web/supabase/migrations/0003_businesses.sql`). Quando o CNPJ ja'
 * esta em uso, o Postgres devolve o erro `23505` (unique_violation) -
 * esta funcao traduz isso numa mensagem clara para o produtor, em vez
 * do erro generico "Não foi possível salvar/enviar".
 */
export const CNPJ_DUPLICADO_MESSAGE =
  "Este CNPJ já está em uso por outro cadastro em andamento ou verificado.";

export function mapCnpjUniqueViolation(
  error: { code?: string | null } | null | undefined
): string | null {
  if (error?.code === "23505") {
    return CNPJ_DUPLICADO_MESSAGE;
  }
  return null;
}
