import Link from "next/link";
import { Moon } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import type { Role } from "@/lib/auth/roles";
import { signOutAction } from "@/lib/auth/sign-out";

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
    <header className="sticky top-0 z-30 border-b border-border bg-white backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex items-center gap-2">
          <Moon className="size-5 fill-primary" aria-hidden />
          <Typography as="span" variant="h4" color="primary">
            Îasy
          </Typography>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-6 md:flex"
        >
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              <Typography
                as="span"
                variant="body"
                weight="medium"
                color="default"
              >
                {link.label}
              </Typography>
            </Link>
          ))}
        </nav>

        {role ? (
          <form action={signOutAction}>
            <button
              type="submit"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Sair
            </button>
          </form>
        ) : (
          <Link
            href="/entrar"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
