import { LEGAL_NOTICE_TEXT } from "./legal-notice-text";

/**
 * Rodape de conexao (RN-04): texto exato exigido nas 8 telas-chave do
 * fluxo publico e de interesse. A Iasy nunca movimenta dinheiro.
 *
 * Usado nas telas do produtor (fora do `AppChrome`, que só cobre
 * público/investidor) - fica em fluxo normal, rolando com o scroll.
 * A variante fixa na tela é `FixedLegalBanner`.
 */
export function ConnectionFooter() {
  return (
    <footer className="border-t border-border bg-background px-6 py-8 text-center">
      <p className="mx-auto max-w-2xl font-body text-sm text-foreground/70">
        <strong className="font-medium text-foreground">{LEGAL_NOTICE_TEXT.strong}</strong>{" "}
        {LEGAL_NOTICE_TEXT.normal}
      </p>
    </footer>
  );
}
