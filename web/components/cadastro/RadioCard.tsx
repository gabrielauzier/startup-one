import { Button } from "@/components/ui/button";

/**
 * Gap de design: opções Sim/Não (PRO-01) e Tipo de organização (PRO-03)
 * eram pills simples sem destaque de seleção; o protótipo usa cards
 * largos selecionáveis. Extrai o padrão ad-hoc já usado em
 * `boas-vindas-form.tsx`/`parte5-form.tsx` (`role="radio"` sobre
 * `Button`) para um componente reutilizável - mesma role/nome
 * acessível, não quebra nenhum teste existente.
 */
export function RadioCard({
  selected,
  onSelect,
  disabled,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className="justify-start"
    >
      {children}
    </Button>
  );
}
