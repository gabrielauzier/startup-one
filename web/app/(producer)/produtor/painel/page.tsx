import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { computeDocumentSituation } from "@/lib/business/document-status";
import { BottomNav } from "@/components/producer/BottomNav";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

/**
 * RF-29/RN-35/RN-41: painel do produtor - selo e data, notas A/S/G,
 * "Ver meu perfil como o investidor vê" (link para a página pública
 * do negócio), visitas ao perfil (RN-35, deduplicadas por dia -
 * `profile_visits`, T39), pedidos aguardando resposta
 * (`document_requests`, T39/T43) e investidores interessados
 * (`interests`, T45/T48), com a barra inferior de navegação. Rota já
 * protegida pelo middleware (`/produtor` -> role `produtor`,
 * lib/auth/roles.ts).
 */
export default async function PainelPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?redirect=/produtor/painel");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, slug, nome, status, nota_a, nota_s, nota_g, verificado_em, selo_valido_ate"
    )
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!business) {
    redirect("/produtor");
  }

  const [{ count: visitasCount }, { data: documentsData }, { data: interestsData }] =
    await Promise.all([
      supabase
        .from("profile_visits")
        .select("id", { count: "exact", head: true })
        .eq("business_id", business.id),
      supabase.from("documents").select("id").eq("business_id", business.id),
      supabase
        .from("interests")
        .select("id, status")
        .eq("business_id", business.id),
    ]);

  const documentIds = (documentsData ?? []).map((d) => d.id as string);
  let pedidosAguardando = 0;
  if (documentIds.length > 0) {
    const { data: requestsData } = await supabase
      .from("document_requests")
      .select("id, status, created_at, expira_em")
      .in("document_id", documentIds)
      .eq("status", "pendente");
    pedidosAguardando = (requestsData ?? []).filter((r) => {
      const situation = computeDocumentSituation(false, {
        status: r.status as "pendente",
        createdAt: r.created_at,
        expiraEm: r.expira_em,
      });
      return situation.kind === "pedido_enviado";
    }).length;
  }

  const interessados = (interestsData ?? []).filter((i) => i.status === "pendente").length;

  const temSelo = business.status === "verificado";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-heading text-2xl">{business.nome}</h1>

      <section className="flex flex-col gap-2 rounded-lg bg-muted p-4">
        {temSelo ? (
          <p className="font-body text-sm font-medium">
            Selo Verificado Îasy — concedido em {formatDate(business.verificado_em)}, válido até{" "}
            {formatDate(business.selo_valido_ate)}
          </p>
        ) : (
          <p className="font-body text-sm text-muted-foreground">Ainda sem o selo Verificado Îasy.</p>
        )}
        {business.nota_a != null && (
          <p className="font-body text-sm">
            Nota Îasy — Ambiental {business.nota_a} · Social {business.nota_s} · Gestão{" "}
            {business.nota_g}
          </p>
        )}
        {business.slug && (
          <Link
            href={`/negocios/${business.slug}`}
            className="font-body text-sm text-primary underline"
          >
            Ver meu perfil como o investidor vê
          </Link>
        )}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1 rounded-lg bg-muted p-4">
          <p className="font-body text-2xl font-medium" data-testid="painel-visitas">
            {visitasCount ?? 0}
          </p>
          <p className="font-body text-xs text-muted-foreground">Visitas ao perfil</p>
        </div>
        <Link
          href="/produtor/pedidos"
          className="flex flex-col gap-1 rounded-lg bg-muted p-4"
        >
          <p className="font-body text-2xl font-medium" data-testid="painel-pedidos">
            {pedidosAguardando}
          </p>
          <p className="font-body text-xs text-muted-foreground">Pedidos aguardando resposta</p>
        </Link>
        <Link
          href="/produtor/interesses"
          className="flex flex-col gap-1 rounded-lg bg-muted p-4"
        >
          <p className="font-body text-2xl font-medium" data-testid="painel-interesses">
            {interessados}
          </p>
          <p className="font-body text-xs text-muted-foreground">Investidores interessados</p>
        </Link>
      </section>

      <BottomNav />
    </main>
  );
}
