import { LEGAL_NOTICE_TEXT } from "./legal-notice-text";

/**
 * Gap de layout geral (RN-04): no protótipo o aviso legal fica fixo na
 * tela, sempre visível. Em mobile fica em fluxo normal, acima da
 * `MobileBottomNav` - as duas competiriam pela mesma faixa de tela.
 */
export function FixedLegalBanner() {
  return (
    <footer className="border-t border-border bg-background/95 px-6 py-3 text-center backdrop-blur supports-[backdrop-filter]:bg-background/80 md:fixed md:inset-x-0 md:bottom-0 md:z-30">
      <p className="mx-auto max-w-2xl font-body text-xs text-foreground/70">
        {LEGAL_NOTICE_TEXT}
      </p>
    </footer>
  );
}
