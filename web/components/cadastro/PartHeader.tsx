import type { DraftSyncStatus } from "@/lib/offline/use-draft-sync";

const STATUS_LABEL: Record<DraftSyncStatus, string> = {
  salvo: "Salvo",
  salvo_no_celular: "Salvo no celular",
  sincronizando: "Sincronizando...",
};

/**
 * RF-11/RN-07: indicador "Parte N de 5 · Salvo" presente em toda parte
 * do cadastro do produtor. CA-07.1/CA-07.2: enquanto offline (ou com
 * mudancas locais ainda nao sincronizadas), mostra "Salvo no celular";
 * volta a "Salvo" depois que `useDraftSync` sincroniza com o servidor.
 */
export function PartHeader({
  part,
  title,
  status = "salvo",
}: {
  part: 1 | 2 | 3 | 4 | 5;
  title: string;
  status?: DraftSyncStatus;
}) {
  return (
    <div>
      <p className="font-body text-sm text-foreground/70">
        Parte {part} de 5 · {STATUS_LABEL[status]}
      </p>
      <h1 className="mt-2 font-heading text-2xl text-primary">{title}</h1>
    </div>
  );
}
