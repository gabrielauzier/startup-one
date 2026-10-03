import Link from "next/link";
import { signOutAction } from "@/lib/auth/sign-out";

/**
 * RF-29: barra inferior fixa do painel do produtor - Início (o
 * painel), Pedidos (T43), Interesses (T48) e Sair (AUTH-16). Componente estático (sem
 * estado de rota ativa por enquanto - as 3 rotas já têm título
 * próprio na página).
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Navegação do produtor"
      className="sticky bottom-0 flex w-full items-center justify-around border-t border-border bg-background py-2"
    >
      <Link href="/produtor/painel" className="font-body text-sm text-foreground">
        Início
      </Link>
      <Link href="/produtor/pedidos" className="font-body text-sm text-foreground">
        Pedidos
      </Link>
      <Link href="/produtor/interesses" className="font-body text-sm text-foreground">
        Interesses
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          className="min-h-11 min-w-11 font-body text-sm text-foreground"
        >
          Sair
        </button>
      </form>
    </nav>
  );
}
