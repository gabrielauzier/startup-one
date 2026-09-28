import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeDocumentSituation } from "@/lib/business/document-status";
import {
  respondDocumentRequestForm,
  revokeDocumentAccessForm,
} from "./actions";

interface DocumentRow {
  id: string;
  titulo: string;
}

interface RequestRow {
  id: string;
  document_id: string;
  investor_id: string;
  status: "pendente" | "liberado" | "recusado" | "expirado" | "retirado";
  created_at: string;
  decidido_em: string | null;
  expira_em: string | null;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

/**
 * RF-23/RN-32/RN-33: fila de pedidos de documento aguardando resposta
 * (Liberar/Recusar) e lista de já respondidos, com opção de retirar um
 * acesso liberado a qualquer momento (CA-33.2). Rota já protegida pelo
 * middleware (`/produtor` -> role `produtor`, lib/auth/roles.ts).
 */
export default async function PedidosPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?redirect=/produtor/pedidos");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, nome")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!business) {
    redirect("/produtor");
  }

  const { data: documentsData } = await supabase
    .from("documents")
    .select("id, titulo")
    .eq("business_id", business.id);
  const documents = (documentsData ?? []) as DocumentRow[];
  const documentTitleById = new Map(documents.map((d) => [d.id, d.titulo]));

  let requests: RequestRow[] = [];
  if (documents.length > 0) {
    const { data: requestsData } = await supabase
      .from("document_requests")
      .select("id, document_id, investor_id, status, created_at, decidido_em, expira_em")
      .in(
        "document_id",
        documents.map((d) => d.id)
      )
      .order("created_at", { ascending: false });
    requests = (requestsData ?? []) as RequestRow[];
  }

  const investorIds = Array.from(new Set(requests.map((r) => r.investor_id)));
  const investorNameById = new Map<string, string>();
  if (investorIds.length > 0) {
    const admin = createAdminClient();
    const { data: investorsData } = await admin
      .from("profiles")
      .select("id, nome")
      .in("id", investorIds);
    for (const investor of investorsData ?? []) {
      investorNameById.set(investor.id as string, investor.nome as string);
    }
  }

  const aguardando = requests.filter((r) => {
    if (r.status !== "pendente") return false;
    const situation = computeDocumentSituation(false, {
      status: r.status,
      createdAt: r.created_at,
      expiraEm: r.expira_em,
    });
    return situation.kind === "pedido_enviado";
  });

  const respondidos = requests.filter((r) => !aguardando.includes(r));

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <h1 className="font-heading text-2xl">Pedidos de documento</h1>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg">Aguardando resposta</h2>
        {aguardando.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">
            Nenhum pedido aguardando resposta.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {aguardando.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted p-4"
              >
                <div>
                  <p className="font-body text-sm font-medium">
                    {documentTitleById.get(request.document_id) ?? "Documento"}
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    {investorNameById.get(request.investor_id) ?? "Investidor"} · pedido em{" "}
                    {formatDate(request.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={respondDocumentRequestForm.bind(null, request.id, "liberar")}>
                    <button
                      type="submit"
                      className="rounded-lg bg-primary px-3 py-1.5 font-body text-sm font-medium text-primary-foreground"
                    >
                      Liberar
                    </button>
                  </form>
                  <form action={respondDocumentRequestForm.bind(null, request.id, "recusar")}>
                    <button
                      type="submit"
                      className="rounded-lg bg-destructive/10 px-3 py-1.5 font-body text-sm font-medium text-destructive"
                    >
                      Recusar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg">Já respondidos</h2>
        {respondidos.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">Nenhum pedido respondido ainda.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {respondidos.map((request) => {
              const situation = computeDocumentSituation(false, {
                status: request.status,
                createdAt: request.created_at,
                expiraEm: request.expira_em,
              });
              const podeRetirar = situation.kind === "liberado";

              return (
                <li
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted p-4"
                >
                  <div>
                    <p className="font-body text-sm font-medium">
                      {documentTitleById.get(request.document_id) ?? "Documento"}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {investorNameById.get(request.investor_id) ?? "Investidor"} ·{" "}
                      {request.status === "liberado" && situation.kind === "liberado" && "Liberado"}
                      {request.status === "liberado" && situation.kind === "acesso_expirado" && "Acesso expirado"}
                      {request.status === "recusado" && "Recusado"}
                      {request.status === "retirado" && "Acesso retirado"}
                      {request.status === "expirado" && "Pedido expirado"}{" "}
                      em {formatDate(request.decidido_em ?? request.created_at)}
                    </p>
                  </div>
                  {podeRetirar && (
                    <form action={revokeDocumentAccessForm.bind(null, request.id)}>
                      <button
                        type="submit"
                        className="rounded-lg bg-destructive/10 px-3 py-1.5 font-body text-sm font-medium text-destructive"
                      >
                        Retirar acesso
                      </button>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
