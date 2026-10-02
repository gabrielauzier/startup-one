const DECISAO_LABEL: Record<string, string> = {
  aprovar: "Aprovado",
  ajuste: "Ajuste solicitado",
  reprovar: "Reprovado",
  suspender: "Suspenso",
  reativar: "Reativado",
};

export interface HistoryEntry {
  id: string;
  decisao: string;
  motivo: string | null;
  createdAt: string;
}

/**
 * RF-16: historico de todas as decisoes de verificacao do negocio, mais
 * recente primeiro - e' a leitura mais util para quem reabre a analise
 * (decisao mais recente reflete o estado atual do negocio).
 */
export function HistoryPanel({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <section className="rounded-md border border-border p-4">
        <h2 className="font-heading text-lg text-primary">Histórico de decisões</h2>
        <p className="font-body text-sm text-foreground/70">Nenhuma decisão registrada ainda.</p>
      </section>
    );
  }

  return (
    <section className="rounded-md border border-border p-4" data-testid="historico-decisoes">
      <h2 className="font-heading text-lg text-primary">Histórico de decisões</h2>
      <ul className="mt-2 flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.id} data-testid="historico-item" className="font-body text-sm">
            <span className="font-medium">{DECISAO_LABEL[entry.decisao] ?? entry.decisao}</span>
            {" · "}
            {new Date(entry.createdAt).toLocaleString("pt-BR")}
            {entry.motivo && <p className="text-foreground/70">{entry.motivo}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
