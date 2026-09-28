import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Timeline, type TimelineEtapa } from "@/components/connection/Timeline";
import { ConnectionFooter } from "@/components/shared/ConnectionFooter";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * RF-27/RN-38/RN-40/CA-38.2 (T47): confirmação de que o interesse foi
 * enviado - mostra o texto de confirmação aceito e o horário
 * (gravados em `interests.confirmacao_texto`/`confirmado_em` pelo
 * T46), o resumo do que foi enviado, e a linha do tempo de 4 etapas
 * (`Timeline`, T45/T48/T49 vão avançando `connection_events`).
 */
export default async function InteresseEnviadoPage(
  props: PageProps<"/negocios/[slug]/interesse-enviado">
) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const interestId = firstParam(searchParams.id);

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/entrar?redirect=${encodeURIComponent(`/negocios/${slug}/interesse-enviado?id=${interestId}`)}`);
  }

  // RLS (`interests_select_own`, T45) já garante que só o próprio
  // investidor lê esta linha - sem `id`, cai no interesse ativo mais
  // recente do investidor para este negócio.
  let query = supabase
    .from("interests")
    .select("id, valor, mensagem, confirmacao_texto, confirmado_em, status, business:businesses(nome)")
    .eq("investor_id", user!.id);

  query = interestId
    ? query.eq("id", interestId)
    : query.in("status", ["pendente", "aceito"]).order("created_at", { ascending: false });

  const { data: interest } = await query.maybeSingle();

  if (!interest) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="font-heading text-xl">Interesse não encontrado</h1>
        <Link href={`/negocios/${slug}`} className="font-body text-sm text-primary underline">
          Voltar para o negócio
        </Link>
      </main>
    );
  }

  const { data: lastEvent } = await supabase
    .from("connection_events")
    .select("etapa")
    .eq("interest_id", interest.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const etapaAtual = (lastEvent?.etapa ?? "pendente") as TimelineEtapa;
  const businessJoin = interest.business as { nome: string } | { nome: string }[] | null;
  const businessNome =
    (Array.isArray(businessJoin) ? businessJoin[0]?.nome : businessJoin?.nome) ?? "este negócio";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-xl">Interesse enviado</h1>
        <p className="font-body text-sm text-muted-foreground">
          A produtora de {businessNome} foi avisada do seu interesse.
        </p>
      </div>

      <section className="flex flex-col gap-2 rounded-lg bg-muted p-4">
        <p className="font-body text-sm">
          Valor: <span className="font-medium">{formatBRL(Number(interest.valor))}</span>
        </p>
        {interest.mensagem && (
          <p className="font-body text-sm">Mensagem: {interest.mensagem}</p>
        )}
        <p className="font-body text-xs text-muted-foreground">
          &ldquo;{interest.confirmacao_texto}&rdquo; — confirmado em{" "}
          {formatDateTime(interest.confirmado_em)}
        </p>
      </section>

      <Timeline etapaAtual={etapaAtual} />

      <Link href={`/negocios/${slug}`} className="font-body text-sm text-primary underline">
        Voltar para o negócio
      </Link>

      <ConnectionFooter />
    </main>
  );
}
