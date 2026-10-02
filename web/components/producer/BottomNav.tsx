import Link from "next/link";

/**
 * RF-29: barra inferior fixa do painel do produtor - Início (o
 * painel), Pedidos (T43) e Interesses (T48). Componente estático (sem
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
    </nav>
  );
}
