import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import {
  canRequestAccess,
  computeDocumentSituation,
  SITUATION_LABELS,
  type DocumentRequestSnapshot,
} from "@/lib/business/document-status";
import { requestDocumentAccessForm } from "./actions";

interface DocumentRow {
  id: string;
  titulo: string;
  tipo: string;
  aberto_a_todos: boolean;
}

interface RequestRow {
  document_id: string;
  status: DocumentRequestSnapshot["status"];
  created_at: string;
  expira_em: string | null;
}

/**
 * RF-22/RN-32 a RN-34: tabela com a situação de cada documento do
 * negócio para o investidor logado - Aberto a todos, Precisa de
 * liberação, Pedido enviado, Liberado para você, Acesso expirado ou
 * Não liberado (lib/business/document-status.ts). Rota já protegida
 * pelo middleware (lib/auth/roles.ts ROUTE_ACCESS) - só investidor ou
 * empresa logados chegam aqui, visitante é redirecionado a /entrar.
 */
export default async function DocumentosPage(props: PageProps<"/negocios/[slug]/documentos">) {
  const { slug } = await props.params;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: businessData } = await supabase
    .from("businesses")
    .select("id, nome, status")
    .eq("slug", slug)
    .maybeSingle();

  if (!businessData || businessData.status !== "verificado") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="font-heading text-xl">Negócio indisponível no momento</h1>
        <Link href="/negocios" className="font-body text-sm text-primary underline">
          Voltar para a vitrine
        </Link>
      </main>
    );
  }

  const { data: documentsData } = await supabase
    .from("documents")
    .select("id, titulo, tipo, aberto_a_todos")
    .eq("business_id", businessData.id);
  const documents = (documentsData ?? []) as DocumentRow[];

  let requests: RequestRow[] = [];
  if (documents.length > 0) {
    const { data: requestsData } = await supabase
      .from("document_requests")
      .select("document_id, status, created_at, expira_em")
      .eq("investor_id", user.id)
      .in(
        "document_id",
        documents.map((d) => d.id)
      )
      .order("created_at", { ascending: false });
    requests = (requestsData ?? []) as RequestRow[];
  }

  const latestRequestByDocument = new Map<string, RequestRow>();
  for (const request of requests) {
    if (!latestRequestByDocument.has(request.document_id)) {
      latestRequestByDocument.set(request.document_id, request);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-1">
        <Link
          href={`/negocios/${slug}`}
          className="font-body text-sm text-muted-foreground underline"
        >
          ← Voltar para {businessData.nome}
        </Link>
        <h1 className="font-heading text-2xl">Documentos</h1>
      </div>

      {documents.length === 0 ? (
        <p className="font-body text-sm text-muted-foreground">
          Este negócio ainda não enviou documentos.
        </p>
      ) : (
        <table className="w-full border-collapse font-body text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2">Documento</th>
              <th className="py-2">Situação</th>
              <th className="py-2">Ação</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => {
              const latest = latestRequestByDocument.get(document.id) ?? null;
              const situation = computeDocumentSituation(
                document.aberto_a_todos,
                latest
                  ? { status: latest.status, createdAt: latest.created_at, expiraEm: latest.expira_em }
                  : null
              );

              return (
                <tr key={document.id} className="border-b border-border">
                  <td className="py-2">{document.titulo}</td>
                  <td className="py-2">
                    {situation.kind === "nao_liberado" ? (
                      <span className="text-destructive">A produtora optou por não liberar</span>
                    ) : (
                      SITUATION_LABELS[situation.kind]
                    )}
                  </td>
                  <td className="py-2">
                    {(situation.kind === "aberto_a_todos" || situation.kind === "liberado") && (
                      <Link
                        href={`/negocios/${slug}/documentos/${document.id}/ver`}
                        className="rounded-lg bg-primary px-3 py-1.5 font-body text-sm font-medium text-primary-foreground"
                      >
                        Ver documento
                      </Link>
                    )}
                    {canRequestAccess(situation) && (
                      <form action={requestDocumentAccessForm.bind(null, slug, document.id)}>
                        <button
                          type="submit"
                          className="rounded-lg bg-primary px-3 py-1.5 font-body text-sm font-medium text-primary-foreground"
                        >
                          Solicitar acesso
                        </button>
                      </form>
                    )}
                    {situation.kind === "pedido_enviado" && (
                      <span className="font-body text-xs text-muted-foreground">
                        Aguardando a produtora
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
