/**
 * Rodape de conexao (RN-04): texto exato exigido nas 8 telas-chave do
 * fluxo publico e de interesse. A Iasy nunca movimenta dinheiro.
 */
export function ConnectionFooter() {
  return (
    <footer className="border-t border-border bg-background px-6 py-8 text-center">
      <p className="mx-auto max-w-2xl font-body text-sm text-foreground/70">
        A Îasy não recebe nem movimenta dinheiro. O contrato e o pagamento são
        feitos por um parceiro financeiro autorizado.
      </p>
    </footer>
  );
}
