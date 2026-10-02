import { cn } from "cn";

const TONES = [
  "bg-emerald-200",
  "bg-amber-200",
  "bg-sky-200",
  "bg-rose-200",
  "bg-lime-200",
  "bg-violet-200",
];

/** Hash simples e determinístico - mesmo `seed` sempre cai no mesmo tom. */
function toneFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % TONES.length;
  }
  return TONES[hash];
}

/**
 * Gap de design (relatório de gaps, seções 3/4): o protótipo mostra foto
 * real do negócio no card/hero do detalhe. Não há coluna de foto em
 * `businesses` nem resolução de URL pública para `evidences` hoje - este
 * placeholder colorido por negócio fecha o gap visual sem fabricar dado.
 * Puramente decorativo (`aria-hidden`), sem texto para não exigir
 * contraste nenhum.
 */
export function BusinessTonePlaceholder({
  seed,
  className,
}: {
  seed: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(toneFor(seed), className)}
    />
  );
}
