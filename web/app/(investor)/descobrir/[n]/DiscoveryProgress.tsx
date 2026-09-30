/**
 * Gap de layout (descoberta guiada): o protótipo mostra uma barra de
 * progresso multistep acima de "Pergunta N de 5" - o app só tinha o
 * texto, sem indicador visual.
 */
export function DiscoveryProgress({ current, total }: { current: number; total: number }) {
  return (
    <div aria-hidden className="flex w-full gap-1.5">
      {Array.from({ length: total }, (_, index) => (
        <div
          key={index}
          className={`h-1.5 flex-1 rounded-full ${
            index < current ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}
