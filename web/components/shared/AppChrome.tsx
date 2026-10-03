"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Moon, X } from "lucide-react";
import type { Role } from "@/lib/auth/roles";
import { SiteHeader } from "./SiteHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { FixedLegalBanner } from "./FixedLegalBanner";
import { Typography } from "@/components/ui/typography";

/**
 * Rotas com chrome própria já testada e funcionando (PartHeader/BottomNav
 * do produtor, telas internas do verificador) - o protótipo nunca
 * desenhou header/nav pública pra elas, então ficam fora do `AppChrome`.
 */
const NO_CHROME_PATTERNS = [/^\/produtor(\/|$)/, /^\/verificacao(\/|$)/];

/**
 * AUTH-05: telas de autenticação ficam só com o logo (sem navegação para
 * outras áreas, banner legal nem nav inferior) - a decisão é entrar.
 */
const AUTH_PATTERNS = [
  /^\/entrar(\/|$)/,
  /^\/cadastro(\/|$)/,
  /^\/esqueci-senha(\/|$)/,
  /^\/redefinir-senha(\/|$)/,
  /^\/completar-perfil(\/|$)/,
  /^\/auth(\/|$)/,
];

function AuthChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="Îasy, voltar ao início">
            <Moon className="size-5 fill-primary" aria-hidden />
            <Typography as="span" variant="h4" color="primary">
              Îasy
            </Typography>
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  );
}

const AVISO_TEXT: Record<string, string> = {
  "sem-permissao": "Essa área é de outro perfil. Você foi levado à sua página inicial.",
  "senha-alterada": "Senha alterada.",
};

/** AUTH-01 (7a) e AUTH-14: `?aviso=sem-permissao` (papel errado) e `?aviso=senha-alterada`. */
function AvisoBanner() {
  const aviso = useSearchParams().get("aviso");
  const [dismissed, setDismissed] = useState(false);

  const text = aviso ? AVISO_TEXT[aviso] : undefined;
  if (!text || dismissed) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-4 border-b border-border bg-banner px-6 py-3"
    >
      <Typography variant="body" size="sm">
        {text}
      </Typography>
      <button
        type="button"
        aria-label="Dispensar aviso"
        onClick={() => setDismissed(true)}
        className="min-h-11 min-w-11"
      >
        <X className="mx-auto size-4" aria-hidden />
      </button>
    </div>
  );
}

/**
 * Chrome global condicional (header + banner legal fixo + nav inferior
 * mobile) - gap de layout geral do relatório de gaps de design: o app
 * não tinha header/nav nenhum, e o rodapé legal rolava com o scroll em
 * vez de ficar fixo.
 */
export function AppChrome({ role, children }: { role: Role | null; children: ReactNode }) {
  const pathname = usePathname();

  if (NO_CHROME_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return <>{children}</>;
  }

  if (AUTH_PATTERNS.some((pattern) => pattern.test(pathname))) {
    return <AuthChrome>{children}</AuthChrome>;
  }

  return (
    <>
      <SiteHeader role={role} />
      <AvisoBanner />
      <div className="flex flex-1 flex-col pb-16 md:pb-10">{children}</div>
      <FixedLegalBanner />
      <MobileBottomNav role={role} />
    </>
  );
}
