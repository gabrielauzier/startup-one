import { Button } from "@/components/ui/button";

/**
 * Gap de design: botão "Continuar" era pequeno e alinhado à direita; o
 * protótipo usa um CTA verde full-width. O "Voltar" migrou para o
 * botão circular do `PartHeader`, então o rodapé agora só tem o CTA.
 */
export function CadastroFooter({
  pending,
  label = "Continuar",
}: {
  pending: boolean;
  label?: string;
}) {
  return (
    <Button type="submit" disabled={pending} className="w-full" size="lg">
      {label}
    </Button>
  );
}
