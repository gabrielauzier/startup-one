import Link from "next/link";
import { Check, ChevronLeft } from "lucide-react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { StepProgress } from "./StepProgress";
import type { DraftSyncStatus } from "@/lib/offline/use-draft-sync";

const STATUS_LABEL: Record<DraftSyncStatus, string> = {
  salvo: "Salvo",
  salvo_no_celular: "Salvo no celular",
  sincronizando: "Sincronizando...",
};

/**
 * RF-11/RN-07: indicador "Parte N de 5" + status de salvamento presente
 * em toda parte do cadastro do produtor. CA-07.1/CA-07.2: enquanto
 * offline (ou com mudancas locais ainda nao sincronizadas), mostra
 * "Salvo no celular"; volta a "Salvo" depois que `useDraftSync`
 * sincroniza com o servidor.
 *
 * Gap de design: botão circular de voltar (em vez de link de texto no
 * rodapé), "Parte N de 5" e o badge de status separados (não mais
 * concatenados por "·"), barra de progresso de 5 segmentos, título em
 * cor neutra (não mais verde).
 */
export function PartHeader({
  part,
  title,
  status = "salvo",
  backHref,
}: {
  part: 1 | 2 | 3 | 4 | 5;
  title: string;
  status?: DraftSyncStatus;
  backHref: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Link
          href={backHref}
          aria-label="Voltar"
          className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
        >
          <ChevronLeft aria-hidden />
        </Link>
        <p className="flex-1 text-center font-body text-sm text-foreground/70">
          Parte {part} de 5
        </p>
        <span className="flex items-center gap-1 font-body text-sm font-medium text-primary">
          <Check className="size-3.5" aria-hidden /> {STATUS_LABEL[status]}
        </span>
      </div>
      <StepProgress current={part} />
      <h1 className="font-heading text-2xl text-foreground">{title}</h1>
    </div>
  );
}
