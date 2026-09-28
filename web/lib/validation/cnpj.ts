/**
 * RN-05/CA-05.1: valida o CNPJ pelo algoritmo real de digito verificador
 * (modulo 11, pesos padrao), aceitando tanto o formato so-digitos quanto
 * o formatado ("00.000.000/0000-00").
 */
export function isValidCnpj(rawValue: string): boolean {
  const digits = rawValue.replace(/\D/g, "");

  if (digits.length !== 14) return false;
  // Sequencias repetidas (ex.: "00000000000000") passam pelo calculo de
  // digito verificador mas nunca sao CNPJs reais.
  if (/^(\d)\1{13}$/.test(digits)) return false;

  const calcDigit = (base: string): number => {
    const weights =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const sum = base
      .split("")
      .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);

    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const base12 = digits.slice(0, 12);
  const firstDigit = calcDigit(base12);
  const secondDigit = calcDigit(base12 + String(firstDigit));

  return digits === base12 + String(firstDigit) + String(secondDigit);
}

/** Formata 14 digitos como "00.000.000/0000-00"; devolve a entrada se invalida. */
export function formatCnpj(rawValue: string): string {
  const digits = rawValue.replace(/\D/g, "").slice(0, 14);
  if (digits.length !== 14) return rawValue;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}
