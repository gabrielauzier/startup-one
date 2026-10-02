import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeDocumentSituation, SITUATION_LABELS } from "@/lib/business/document-status";
import { EditInterestForm } from "./EditInterestForm";
import { cancelInterestForm } from "./actions";

interface InterestRow {
  id: string;
  business_id: string;
  valor: number;
  status: "pendente" | "aceito" | "recusado" | "expirado" | "cancelado";
}

interface RequestRow {
  id: string;
  document_id: string;
  status: "pendente" | "liberado" | "recusado" | "expirado" | "retirado";
  created_at: string;
  expira_em: string | null;
}

const INTEREST_STATUS_LABEL: Record<InterestRow["status"], string> = {
  pendente: "Pendente",
  aceito: "Aceito",
  recusado: "Não aceito pela produtora",
  expirado: "Expirado",
  cancelado: "Cancelado",
};

/**
 * RF-27/RN-37/RN-39/T51: "Meus interesses" - lista todos os
 * interesses e pedidos de documento do investidor logado com a
 * situação atual. Editar valor ou cancelar só fica disponível
 * enquanto o interesse está Pendente (RN-36/RN-37, `EditInterestForm`
 * é client component por causa do `useState` controlado, mesmo motivo
 * do `InterestModal`, T46). Rota já protegida pelo middleware
 * (`/interesses` -> role investidor/empresa, lib/auth/roles.ts).
 */
export default async function InteressesInvestidorPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?redirect=/interesses");
  }

  const { data: interestsData } = await supabase
    .from("interests")
    .select("id, business_id, valor, status")
    .eq("investor_id", user!.id)
    .order("created_at", { ascending: false });
  const interests = (interestsData ?? []) as InterestRow[];

  const { data: requestsData } = await supabase
    .from("document_requests")
    .select("id, document_id, status, created_at, expira_em")
    .eq("investor_id", user!.id)
    .order("created_at", { ascending: false });
  const requests = (requestsData ?? []) as RequestRow[];

  const admin = createAdminClient();
  const businessIds = Array.from(new Set(interests.map((i) => i.business_id)));
  const documentIds = Array.from(new Set(requests.map((r) => r.document_id)));

  const [{ data: businessesData }, { data: documentsData }] = await Promise.all([
    businessIds.length > 0
      ? admin.from("businesses").select("id, nome, valor_busca").in("id", businessIds)
      : Promise.resolve({ data: [] }),
    documentIds.length > 0
      ? admin.from("documents").select("id, titulo, business_id").in("id", documentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const businessById = new Map(
    (businessesData ?? []).map((b) => [b.id as string, b as { nome: string; valor_busca: number }])
  );
  const documentById = new Map(
    (documentsData ?? []).map((d) => [d.id as string, d as { titulo: string; business_id: string }])
  );

  function formatBRL(value: number): string {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <h1 className="font-heading text-2xl">Meus interesses</h1>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg">Interesses</h2>
        {interests.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">
            Você ainda não demonstrou interesse em nenhum negócio.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {interests.map((interest) => {
              const business = businessById.get(interest.business_id);
              return (
                <li
                  key={interest.id}
                  data-testid="meu-interesse"
                  className="flex flex-col gap-2 rounded-lg bg-muted p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-body text-sm font-medium">
                      {business?.nome ?? "Negócio"} · {formatBRL(Number(interest.valor))}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {INTEREST_STATUS_LABEL[interest.status]}
                    </p>
                  </div>

                  {interest.status === "pendente" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <EditInterestForm
                        interestId={interest.id}
                        valorAtual={Number(interest.valor)}
                        valorBusca={Number(business?.valor_busca ?? 0)}
                      />
                      <form action={cancelInterestForm.bind(null, interest.id)}>
                        <button
                          type="submit"
                          data-testid="cancelar-interesse"
                          className="rounded-lg bg-destructive/10 px-3 py-1.5 font-body text-sm font-medium text-destructive"
                        >
                          Cancelar
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg">Pedidos de documento</h2>
        {requests.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">
            Você ainda não pediu acesso a nenhum documento.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {requests.map((request) => {
              const document = documentById.get(request.document_id);
              const situation = computeDocumentSituation(false, {
                status: request.status,
                createdAt: request.created_at,
                expiraEm: request.expira_em,
              });
              return (
                <li
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-4"
                >
                  <p className="font-body text-sm font-medium">{document?.titulo ?? "Documento"}</p>
                  <p className="font-body text-xs text-muted-foreground">
                    {SITUATION_LABELS[situation.kind]}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
