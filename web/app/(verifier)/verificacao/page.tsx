import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  businessDaysBetween,
  classifyQueueUrgency,
  type QueueUrgency,
} from "@/lib/business-days";
import { AssumirButton } from "./AssumirButton";

interface QueueItem {
  id: string;
  nome: string | null;
  entradaEm: Date;
  diasUteis: number;
  urgencia: QueueUrgency;
  assignedTo: string | null;
  assignedToNome: string | null;
}

const URGENCY_LABEL: Record<QueueUrgency, string> = {
  normal: "No prazo",
  amarelo: "Atenção",
  vermelho: "Atrasado",
};

const URGENCY_CLASS: Record<QueueUrgency, string> = {
  normal: "bg-muted text-foreground/70",
  amarelo: "bg-yellow-100 text-yellow-800",
  vermelho: "bg-red-100 text-red-800",
};

/**
 * RF-14/RN-16/RN-17: fila de negocios enviados para analise, do mais
 * antigo para o mais novo, com dias uteis decorridos coloridos
 * (amarelo >3, vermelho >5 - CA-16.1) e o responsavel atual (trava de
 * 24h, CA-17.1). Le `businesses` pelo cliente de sessao (RLS do T25 ja
 * cobre "verificador ve tudo"); o restante (revisoes, nomes de outros
 * profiles) usa o cliente admin, sem policy propria ainda.
 */
export default async function VerificacaoPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, nome, assigned_to, assigned_at")
    .eq("status", "em_analise");

  const admin = createAdminClient();

  const items: QueueItem[] = [];
  const verifierIds = new Set<string>();

  for (const business of businesses ?? []) {
    const { data: revision } = await admin
      .from("business_revisions")
      .select("created_at")
      .eq("business_id", business.id)
      .eq("status", "em_analise")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const entradaEm = revision?.created_at
      ? new Date(revision.created_at)
      : new Date();
    const diasUteis = businessDaysBetween(entradaEm, new Date());

    if (business.assigned_to) verifierIds.add(business.assigned_to);

    items.push({
      id: business.id,
      nome: business.nome,
      entradaEm,
      diasUteis,
      urgencia: classifyQueueUrgency(diasUteis),
      assignedTo: business.assigned_to,
      assignedToNome: null,
    });
  }

  let verifierNames: Record<string, string> = {};
  if (verifierIds.size > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, nome")
      .in("id", Array.from(verifierIds));
    verifierNames = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.nome as string])
    );
  }

  for (const item of items) {
    if (item.assignedTo) item.assignedToNome = verifierNames[item.assignedTo] ?? null;
  }

  items.sort((a, b) => a.entradaEm.getTime() - b.entradaEm.getTime());

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <p className="font-body text-sm text-foreground/70">Verificação</p>
        <h1 className="mt-2 font-heading text-2xl text-primary">
          Fila de verificação
        </h1>
      </div>

      {items.length === 0 ? (
        <p className="font-body text-sm text-foreground/70">
          Nenhum negócio aguardando análise no momento.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              data-testid="fila-item"
              data-urgencia={item.urgencia}
              className="flex items-center justify-between rounded-md border border-border px-4 py-3"
            >
              <div className="flex flex-col gap-1">
                <Link
                  href={`/verificacao/${item.id}`}
                  className="font-body text-sm font-medium text-foreground hover:underline"
                >
                  {item.nome ?? "Sem nome"}
                </Link>
                <span className="font-body text-xs text-foreground/70">
                  {item.diasUteis} dia(s) útil(eis) na fila
                  {item.assignedToNome ? ` · com ${item.assignedToNome}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-1 font-body text-xs ${URGENCY_CLASS[item.urgencia]}`}
                >
                  {URGENCY_LABEL[item.urgencia]}
                </span>
                <AssumirButton businessId={item.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
