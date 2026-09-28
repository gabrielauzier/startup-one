/**
 * RF-11/RN-07: indicador "Parte N de 5 · Salvo" presente em toda parte
 * do cadastro do produtor.
 */
export function PartHeader({ part, title }: { part: 1 | 2 | 3 | 4 | 5; title: string }) {
  return (
    <div>
      <p className="font-body text-sm text-foreground/70">Parte {part} de 5 · Salvo</p>
      <h1 className="mt-2 font-heading text-2xl text-primary">{title}</h1>
    </div>
  );
}
