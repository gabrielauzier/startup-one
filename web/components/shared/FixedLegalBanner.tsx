import { Info } from "lucide-react";
import { Typography } from "../ui/typography";
import { LEGAL_NOTICE_TEXT } from "./legal-notice-text";

/**
 * Gap de layout geral (RN-04): no protótipo o aviso legal fica fixo na
 * tela, sempre visível. Em mobile fica em fluxo normal, acima da
 * `MobileBottomNav` - as duas competiriam pela mesma faixa de tela.
 */
export function FixedLegalBanner() {
  return (
    <footer className="border-t border-border bg-banner px-6 py-4 text-center md:fixed md:inset-x-0 md:bottom-0 md:z-30 flex items-center justify-center">
      <Info className="inline-block mr-3 w-4 h-4 text-primary" />

      <Typography color="muted" size="xs" weight="medium">
        <Typography as="strong" color="default" weight="semibold" size="xs">
          {LEGAL_NOTICE_TEXT.strong}
        </Typography>{" "}
        {LEGAL_NOTICE_TEXT.normal}
      </Typography>
    </footer>
  );
}
