/**
 * RN-34/CA-34.1: marca d'água "Visualizado por [nome] em [data]" sobre
 * o documento sensível - texto repetido em mosaico (dificulta recortar
 * um print sem a marca) + uma linha única e legível para acessibilidade
 * e para os testes. design.md já registra que uma marca d'água
 * client-side não impede print/screenshot - aceito pela PRD (RN-34: a
 * marca serve para rastrear, não para bloquear a captura), não é um
 * gap de implementação.
 */
export function Watermark({ nome, dataFormatada }: { nome: string; dataFormatada: string }) {
  const texto = `Visualizado por ${nome} em ${dataFormatada}`;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      <div
        aria-hidden="true"
        className="flex h-full w-full flex-wrap content-center items-center justify-center gap-10 overflow-hidden"
      >
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className="-rotate-[25deg] whitespace-nowrap font-body text-sm font-medium text-foreground/25"
          >
            {texto}
          </span>
        ))}
      </div>
      <span className="sr-only">{texto}</span>
    </div>
  );
}
