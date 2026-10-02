/**
 * Gap de design (PRO-02): o protótipo mostra telefone/CNPJ já
 * formatados enquanto o produtor digita. Sem lib nova - só
 * formatadores puros aplicados no `onChange` dos inputs controlados.
 */
export function formatPhoneBR(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) return digits.replace(/^(\d*)$/, "$1");
  if (digits.length <= 6) return digits.replace(/^(\d{2})(\d*)$/, "($1) $2");
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d*)$/, "($1) $2-$3");
  }
  return digits.replace(/^(\d{2})(\d{5})(\d*)$/, "($1) $2-$3");
}

/** Remove toda formatação, devolvendo só os dígitos. */
export function unformat(masked: string): string {
  return masked.replace(/\D/g, "");
}
