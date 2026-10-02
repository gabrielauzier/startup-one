import { Typography } from "@/components/ui/typography";

const DIMENSIONS = [
  { key: "notaA", label: "Ambiental" },
  { key: "notaS", label: "Social" },
  { key: "notaG", label: "Gestão" },
] as const;

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * Gap de design: o protótipo mostra as notas Îasy como barras de
 * progresso, não como uma linha de texto corrido. Notas já são 0-100
 * (ver nota_a/nota_s/nota_g em businesses).
 */
export function ScoreBars({
  notaA,
  notaS,
  notaG,
}: {
  notaA: number;
  notaS: number;
  notaG: number;
}) {
  const values = { notaA, notaS, notaG };

  return (
    <div className="flex flex-col gap-2">
      <Typography variant="caption" color="muted">
        Nota Îasy, de 0 a 100
      </Typography>
      {DIMENSIONS.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-3">
          <Typography as="span" variant="body" className="w-20 shrink-0">
            {label}
          </Typography>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${clamp(values[key])}%` }}
            />
          </div>
          <Typography as="span" variant="body" weight="medium" className="w-8 shrink-0 text-right">
            {values[key]}
          </Typography>
        </div>
      ))}
    </div>
  );
}
