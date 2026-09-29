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

/**
 * CA-14.1 (Fix rodada 2): `<select>`, checkbox e `<input type="range">`
 * nao aceitam `readOnly` de forma confiavel (o navegador ignora ou
 * ainda permite interacao), entao esses controles continuam com
 * `disabled` quando travados - mas um controle `disabled` nunca entra
 * no `FormData` do submit. Este componente cobre o buraco: quando o
 * campo esta travado, reemite o valor atual como `<input type="hidden">`
 * com o mesmo `name`, para que o servidor receba o valor salvo em vez
 * de nada. Sem efeito quando o campo esta editavel (o proprio controle
 * ja envia o valor).
 */
export function LockedHiddenValue({
  ajuste,
  campo,
  name,
  value,
}: {
  ajuste: FieldAjusteInfo | null;
  campo: string;
  name: string;
  value: string;
}) {
  if (!isFieldLocked(ajuste, campo)) return null;
  return <input type="hidden" name={name} value={value} />;
}

/** Mesma ideia de `LockedHiddenValue`, para um grupo de checkboxes que
 * compartilham `name` (ex.: "produtos") - reemite um hidden por valor
 * atualmente marcado. */
export function LockedHiddenValues({
  ajuste,
  campo,
  name,
  values,
}: {
  ajuste: FieldAjusteInfo | null;
  campo: string;
  name: string;
  values: string[];
}) {
  if (!isFieldLocked(ajuste, campo)) return null;
  return (
    <>
      {values.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
    </>
  );
}
