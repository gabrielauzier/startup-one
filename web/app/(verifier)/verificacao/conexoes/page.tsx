import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { presentToPartnerForm, addObservation } from "./actions";

interface InterestRow {
  id: string;
  business_id: string;
  investor_id: string;
  valor: number;
}

interface EventRow {
  id: string;
  interest_id: string;
  etapa: string;
  observacao: string | null;
  created_at: string;
}

const ETAPA_LABEL: Record<string, string> = {
  pendente: "Interesse enviado",
  aceita: "A produtora respondeu",
  apresentada_ao_parceiro: "Apresentamos as partes",
  em_negociacao: "Em negociação",
  concluida: "Contrato com o parceiro",
  nao_avancou: "Não avançou",
};

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

/**
 * RF-30/RN-40: painel de conexões do verificador - lista interesses
 * Aceitos com a etapa atual, permite "Apresentar ao parceiro"
 * (CA-40.1: só disponível a partir de `aceita`, então só listar
 * interesses `status='aceito'` já garante isso - um interesse ainda
 * Pendente nunca aparece aqui) e registrar observações livres na
 * linha do tempo. Rota protegida pelo middleware
 * (`/verificacao` -> role `verificador`, lib/auth/roles.ts).
 */
export default async function ConexoesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { data: interestsData } = await supabase
    .from("interests")
    .select("id, business_id, investor_id, valor")
    .eq("status", "aceito")
    .order("created_at", { ascending: false });
  const interests = (interestsData ?? []) as InterestRow[];

  const admin = createAdminClient();
  const businessIds = Array.from(new Set(interests.map((i) => i.business_id)));
  const investorIds = Array.from(new Set(interests.map((i) => i.investor_id)));

  const [{ data: businessesData }, { data: investorsData }, { data: eventsData }] =
    await Promise.all([
      businessIds.length > 0
        ? admin.from("businesses").select("id, nome").in("id", businessIds)
        : Promise.resolve({ data: [] }),
      investorIds.length > 0
        ? admin.from("profiles").select("id, nome").in("id", investorIds)
        : Promise.resolve({ data: [] }),
      interests.length > 0
        ? supabase
            .from("connection_events")
            .select("id, interest_id, etapa, observacao, created_at")
            .in(
              "interest_id",
              interests.map((i) => i.id)
            )
            .order("created_at", { ascending: true })
        : Promise.resolve({ data: [] }),
    ]);

  const businessNameById = new Map((businessesData ?? []).map((b) => [b.id as string, b.nome as string]));
  const investorNameById = new Map((investorsData ?? []).map((i) => [i.id as string, i.nome as string]));
  const events = (eventsData ?? []) as EventRow[];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-heading text-2xl">Painel de conexões</h1>

      {interests.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">
          Nenhum interesse Aceito por enquanto.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {interests.map((interest) => {
            const interestEvents = events.filter((e) => e.interest_id === interest.id);
            const etapaAtual = interestEvents[interestEvents.length - 1]?.etapa ?? "aceita";
            const podeApresentar = etapaAtual === "aceita";

            return (
              <li
                key={interest.id}
                data-testid="conexao-item"
                className="flex flex-col gap-3 rounded-lg bg-muted p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-body text-sm font-medium">
                    {businessNameById.get(interest.business_id) ?? "Negócio"} ·{" "}
                    {investorNameById.get(interest.investor_id) ?? "Investidor"} ·{" "}
                    {formatBRL(Number(interest.valor))}
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    {ETAPA_LABEL[etapaAtual] ?? etapaAtual}
                  </p>
                </div>

                {podeApresentar && (
                  <form action={presentToPartnerForm.bind(null, interest.id)}>
                    <button
                      type="submit"
                      data-testid="apresentar-parceiro"
                      className="rounded-lg bg-primary px-3 py-1.5 font-body text-sm font-medium text-primary-foreground"
                    >
                      Apresentar ao parceiro
                    </button>
                  </form>
                )}

                <ul className="flex flex-col gap-1">
                  {interestEvents.map((event) => (
                    <li key={event.id} className="font-body text-xs text-muted-foreground">
                      {formatDate(event.created_at)} — {ETAPA_LABEL[event.etapa] ?? event.etapa}
                      {event.observacao ? ` — ${event.observacao}` : ""}
                    </li>
                  ))}
                </ul>

                <form
                  action={async (formData: FormData) => {
                    "use server";
                    const observacao = String(formData.get("observacao") ?? "");
                    await addObservation(interest.id, etapaAtual, observacao);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    name="observacao"
                    placeholder="Registrar observação"
                    className="flex-1 rounded-lg border border-input bg-white px-2.5 py-1.5 font-body text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  <button
                    type="submit"
                    data-testid="registrar-observacao"
                    className="rounded-lg border border-input px-3 py-1.5 font-body text-sm"
                  >
                    Registrar
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
