/**
 * RN-40: linha do tempo de 4 etapas de um interesse, do envio até o
 * contrato com o parceiro financeiro. `etapaAtual` é a etapa mais
 * recente registrada em `connection_events` (T45/T47/T48/T49) -
 * qualquer etapa igual ou anterior a ela é marcada como concluída.
 */

export type TimelineEtapa =
  | "pendente"
  | "aceita"
  | "apresentada_ao_parceiro"
  | "em_negociacao"
  | "concluida"
  | "nao_avancou";

const STEPS: { id: string; label: string; matches: TimelineEtapa[] }[] = [
  { id: "enviado", label: "Interesse enviado", matches: ["pendente"] },
  { id: "responde", label: "A produtora responde", matches: ["aceita"] },
  {
    id: "apresenta",
    label: "Apresentamos as partes",
    matches: ["apresentada_ao_parceiro"],
  },
  {
    id: "contrato",
    label: "Contrato com o parceiro",
    matches: ["em_negociacao", "concluida"],
  },
];

const ORDER: TimelineEtapa[] = [
  "pendente",
  "aceita",
  "apresentada_ao_parceiro",
  "em_negociacao",
  "concluida",
];

export function Timeline({ etapaAtual }: { etapaAtual: TimelineEtapa }) {
  const currentIndex = ORDER.indexOf(etapaAtual);

  return (
    <ol className="flex flex-col gap-3" data-testid="timeline-interesse">
      {STEPS.map((step, index) => {
        const stepOrderIndex = ORDER.indexOf(step.matches[0]);
        const done = currentIndex >= 0 && stepOrderIndex <= currentIndex;
        return (
          <li key={step.id} className="flex items-center gap-3">
            <span
              className={
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-body text-xs " +
                (done
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground")
              }
            >
              {index + 1}
            </span>
            <span
              className={
                "font-body text-sm " + (done ? "text-foreground" : "text-muted-foreground")
              }
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
