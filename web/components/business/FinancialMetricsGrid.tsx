import { cn } from "cn";
import { Typography } from "@/components/ui/typography";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

/**
 * Gap de design: Busca/Prazo/Retorno eram uma linha corrida de texto;
 * o protótipo organiza em 3 colunas com rótulo em cima e valor embaixo.
 * Usado tanto no card quanto no detalhe do negócio, para não duplicar
 * o grid duas vezes.
 */
export function FinancialMetricsGrid({
  valorBusca,
  prazoMeses,
  retornoProposto,
  bordered,
}: {
  valorBusca: number;
  prazoMeses: number;
  retornoProposto: number;
  bordered?: boolean;
}) {
  const items = [
    { label: "Busca", value: formatBRL(valorBusca) },
    { label: "Prazo", value: `${prazoMeses} meses` },
    { label: "Retorno proposto", value: `${retornoProposto}% ao ano` },
  ];

  return (
    <div
      className={cn(
        "grid grid-cols-3 gap-2",
        bordered && "border-y border-border py-3",
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5">
          <Typography variant="caption" color="muted">
            {item.label}
          </Typography>
          <Typography variant="body" weight="medium">
            {item.value}
          </Typography>
        </div>
      ))}
    </div>
  );
}
