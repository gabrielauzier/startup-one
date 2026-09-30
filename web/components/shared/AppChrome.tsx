"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Role } from "@/lib/auth/roles";
import { SiteHeader } from "./SiteHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { FixedLegalBanner } from "./FixedLegalBanner";

/**
 * Rotas com chrome própria já testada e funcionando (PartHeader/BottomNav
 * do produtor, telas internas do verificador) - o protótipo nunca
 * desenhou header/nav pública pra elas, então ficam fora do `AppChrome`.
 */
const NO_CHROME_PATTERNS = [/^\/produtor(\/|$)/, /^\/verificacao(\/|$)/];

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

  return (
    <>
      <SiteHeader role={role} />
      <div className="flex flex-1 flex-col pb-16 md:pb-10">{children}</div>
      <FixedLegalBanner />
      <MobileBottomNav role={role} />
    </>
  );
}
