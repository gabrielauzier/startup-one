import Link from "next/link";
import type { Role } from "@/lib/auth/roles";

interface NavLink {
  href: string;
  label: string;
}

const ANON_LINKS: NavLink[] = [
  { href: "/", label: "Início" },
  { href: "/negocios", label: "Negócios" },
  { href: "/produtor", label: "Produtores" },
];

const INVESTOR_LINKS: NavLink[] = [
  { href: "/descobrir/1", label: "Descobrir" },
  { href: "/negocios", label: "Negócios" },
  { href: "/interesses", label: "Interesses" },
];

function linksForRole(role: Role | null): NavLink[] {
  if (role === "investidor" || role === "empresa") return INVESTOR_LINKS;
  return ANON_LINKS;
}

/**
 * Nav inferior fixa do mobile (gap de layout geral) - mesmo papel do
 * `SiteHeader` em desktop, mas como barra fixa embaixo, igual ao
 * `BottomNav` do produtor (que já existia só pro painel do produtor).
 */
export function MobileBottomNav({ role }: { role: Role | null }) {
  const links = linksForRole(role);

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-background py-2 md:hidden"
    >
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="font-body text-sm text-foreground">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
