/**
 * Gera um CNPJ valido (digito verificador real) e unico por chamada,
 * para os e2e nao colidirem no indice unico parcial de
 * `businesses.cnpj` (RN-05/CA-05.3) quando o banco local do Supabase
 * persiste dados entre execuções de teste.
 */
function calcDigit(base: string): number {
  const weights =
    base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const sum = base
    .split("")
    .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function randomValidCnpj(): string {
  const base12 = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
  const d1 = calcDigit(base12);
  const d2 = calcDigit(base12 + String(d1));
  return base12 + String(d1) + String(d2);
}
