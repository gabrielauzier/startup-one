import Link from "next/link";
import { Moon } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import type { Role } from "@/lib/auth/roles";

interface NavLink {
  href: string;
  label: string;
}

const ANON_LINKS: NavLink[] = [
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/negocios", label: "Negócios verificados" },
  { href: "/produtor", label: "Para produtores" },
];

const INVESTOR_LINKS: NavLink[] = [
  { href: "/descobrir/1", label: "Descobrir" },
  { href: "/negocios", label: "Negócios verificados" },
  { href: "/interesses", label: "Meus interesses" },
];

/** Gap de design: produtor/verificador navegando fora da própria área cai no set público. */
function linksForRole(role: Role | null): NavLink[] {
  if (role === "investidor" || role === "empresa") return INVESTOR_LINKS;
  return ANON_LINKS;
}

/**
 * Cabeçalho de desktop (a nav some em mobile, `MobileBottomNav` assume) -
 * gap de layout geral do relatório de gaps de design: o protótipo tem
 * logo + nav por perfil + "Entrar" em todas as telas públicas/do
 * investidor; o app não tinha header nenhum.
 */
export function SiteHeader({ role }: { role: Role | null }) {
  const links = linksForRole(role);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-lg text-primary"
        >
          <Moon className="size-5 fill-primary" aria-hidden />
          Îasy
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm text-foreground/80 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/entrar"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}
