import Link from "next/link";
import { cn } from "cn";

/** Abas "Entrar / Criar conta" do topo do card (design E8). */
export function AuthTabs({ current }: { current: "entrar" | "cadastro" }) {
  const tab = (key: "entrar" | "cadastro", href: string, label: string) => (
    <Link
      href={href}
      aria-current={current === key ? "page" : undefined}
      className={cn(
        "flex-1 border-b-2 py-3 text-center font-body text-sm font-medium",
        current === key
          ? "border-primary text-primary"
          : "border-transparent text-foreground/70 hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );

  return (
    <nav aria-label="Entrar ou criar conta" className="flex">
      {tab("entrar", "/entrar", "Entrar")}
      {tab("cadastro", "/cadastro", "Criar conta")}
    </nav>
  );
}
