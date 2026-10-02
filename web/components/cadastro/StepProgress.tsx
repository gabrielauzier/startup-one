const TOTAL_STEPS = 5;

/** Gap de design: barra de progresso em 5 segmentos do protótipo, ausente no MVP. */
export function StepProgress({ current }: { current: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex gap-1.5" aria-hidden="true">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => (
        <div
          key={step}
          className={
            "h-1.5 flex-1 rounded-full " +
            (step <= current ? "bg-primary" : "bg-muted")
          }
        />
      ))}
    </div>
  );
}
