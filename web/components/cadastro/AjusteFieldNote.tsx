import type { FieldAjusteInfo } from "@/lib/business/adjustable-fields";

/**
 * CA-14.1: quando o negocio esta em `ajuste_solicitado`, so' os campos
 * marcados pelo verificador (`ajuste.camposEditaveis`) ficam editaveis
 * - os demais ficam bloqueados. `ajuste === null` (negocio fora de
 * ajuste) significa "tudo editavel", o comportamento normal do
 * rascunho.
 */
export function isFieldLocked(ajuste: FieldAjusteInfo | null, campo: string): boolean {
  if (!ajuste) return false;
  return !ajuste.camposEditaveis.has(campo);
}

/** CA-14.1: mostra o comentario do verificador ao lado do campo marcado. */
export function AjusteComment({
  ajuste,
  campo,
}: {
  ajuste: FieldAjusteInfo | null;
  campo: string;
}) {
  const comentario = ajuste?.comentarios[campo];
  if (!comentario) return null;

  return (
    <p
      className="font-body text-sm text-primary"
      data-testid={`ajuste-comentario-${campo}`}
    >
      Comentário do verificador: {comentario}
    </p>
  );
}
