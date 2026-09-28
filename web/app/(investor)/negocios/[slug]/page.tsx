import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RecordVisit } from "@/components/business/RecordVisit";
import { sumInterests, formatInterestSummary, type Interest } from "@/lib/business/interest-sum";
import { InterestModal } from "./_components/InterestModal";

interface BusinessRow {
  id: string;
  owner_id: string;
  slug: string;
  nome: string;
  tipo_org: string | null;
  cidade_ibge: string | null;
  uf: string | null;
  familias: number | null;
  anos_atividade: number | null;
  recebe_visitas: boolean;
  produtos: string[];
  producao_mensal_kg: number | null;
  praticas: string[];
  finalidade: string | null;
  valor_busca: number;
  prazo_meses: number;
  retorno_proposto: number;
  status: string;
  nota_a: number;
  nota_s: number;
  nota_g: number;
  verificado_em: string | null;
}

const TIPO_ORG_LABELS: Record<string, string> = {
  cooperativa: "Cooperativa",
  associacao: "Associação",
  pequena_empresa: "Pequena empresa",
};

const FINALIDADE_LABELS: Record<string, string> = {
  obras: "Obras e estrutura",
  equipamentos: "Equipamentos",
  area: "Aumentar a área",
  contas: "Contas do dia a dia",
};

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-BR");
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

type TabId = "producao" | "negocio" | "quem-cuida" | "dinheiro";

const TABS: { id: TabId; label: string; public: boolean }[] = [
  { id: "producao", label: "A produção", public: true },
  { id: "negocio", label: "O negócio", public: false },
  { id: "quem-cuida", label: "Quem cuida", public: false },
  { id: "dinheiro", label: "O dinheiro", public: false },
];

/**
 * RF-21/RN-26/RN-30/RN-31: cabeçalho público completo, abas "A
 * produção" (pública) e "O negócio"/"Quem cuida"/"O dinheiro"
 * (exigem investidor/empresa logados - CA-26.1), lateral com
 * interesse somado (RN-29) e etiqueta "Recebe visitas".
 *
 * A aba "Documentos" (RN-32 a RN-35) é uma rota separada,
 * `/negocios/[slug]/documentos` (T41/T42) - já protegida pelo
 * middleware (lib/auth/roles.ts ROUTE_ACCESS), então só aparece como
 * link aqui, sem conteúdo próprio nesta página.
 *
 * RF-26/RN-36 a RN-38 (T46): botão "Tenho interesse" abre o
 * `InterestModal`. Visitante sem sessão vê o botão como um link para
 * `/entrar?redirect=...&interesse=1` (CA-36.1) - o parâmetro
 * `interesse=1` sobrevive ao login (mesmo mecanismo de `redirect` já
 * usado pelas abas privadas) e reabre o modal automaticamente ao
 * voltar. Produtor logado não vê o botão (CA-36.3). Investidor/empresa
 * com um interesse Pendente ou Aceito já registrado vê "Ver meu
 * interesse" em vez do botão (CA-37.1, índice único parcial de T45
 * garante que só existe 1 desses por investidor/negócio).
 *
 * SPEC_DEVIATION (RN-31/CA-31.1): o modelo de dados (PRD §7.3) não tem
 * uma tabela de "pessoas"/equipe do negócio - só `businesses.owner_id`.
 * A aba "Quem cuida" mostra o nome do dono do cadastro
 * (profiles.nome) com a função "Responsável pelo negócio"; nenhum
 * campo de telefone, e-mail ou CPF é consultado nem exibido,
 * satisfazendo CA-31.1 mesmo sem uma tabela de equipe dedicada.
 */
export default async function NegocioPage(props: PageProps<"/negocios/[slug]">) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const abaParam = firstParam(searchParams.aba);
  const autoOpenInteresse = firstParam(searchParams.interesse) === "1";
  const aba: TabId = (["producao", "negocio", "quem-cuida", "dinheiro"] as TabId[]).includes(
    abaParam as TabId
  )
    ? (abaParam as TabId)
    : "producao";

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = profile?.role ?? null;
  }

  const { data: businessData } = await supabase
    .from("businesses")
    .select(
      "id, owner_id, slug, nome, tipo_org, cidade_ibge, uf, familias, anos_atividade, recebe_visitas, produtos, producao_mensal_kg, praticas, finalidade, valor_busca, prazo_meses, retorno_proposto, status, nota_a, nota_s, nota_g, verificado_em"
    )
    .eq("slug", slug)
    .maybeSingle();

  const business = businessData as BusinessRow | null;

  // RN-13/CA-13.2: negócio Suspenso, Reprovado ou em qualquer status
  // que não seja o público (Verificado) mostra "indisponível" em vez
  // de vazar dados de um negócio ainda não aprovado - a policy
  // `businesses_select_public_verificado` (T25) já esconde isso de
  // quem não é o dono, mas o dono acessando a própria página pública
  // (em vez do painel) também vê esta mensagem.
  if (!business || business.status !== "verificado") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="font-heading text-xl">Negócio indisponível no momento</h1>
        <Link href="/negocios" className="font-body text-sm text-primary underline">
          Voltar para a vitrine
        </Link>
      </main>
    );
  }

  const admin = createAdminClient();
  const [{ data: certificationsData }, { data: ownerProfile }] = await Promise.all([
    admin
      .from("certifications")
      .select("certificadora")
      .eq("business_id", business.id)
      .eq("conferido", true),
    admin.from("profiles").select("nome").eq("id", business.owner_id).maybeSingle(),
  ]);
  const certificadoras = (certificationsData ?? []).map(
    (c) => c.certificadora as string
  );

  const canSeePrivateTabs = role === "investidor" || role === "empresa";
  const isOwner = user != null && business.owner_id === user.id;

  const { data: interestRows } = await admin
    .from("interests")
    .select("valor, status")
    .eq("business_id", business.id);
  const interests = (interestRows ?? []) as Interest[];

  const { somaAbsoluta, percentualBarra } = sumInterests(interests, Number(business.valor_busca));

  // RN-37/CA-37.1: se o investidor logado já tem um interesse
  // Pendente/Aceito neste negócio, o botão vira "Ver meu interesse"
  // em vez de abrir o modal de novo (o índice único parcial de T45
  // já impediria um 2º envio, mas a UI evita a tentativa).
  let ownActiveInterestId: string | null = null;
  if (user && (role === "investidor" || role === "empresa")) {
    const { data: ownInterest } = await supabase
      .from("interests")
      .select("id")
      .eq("business_id", business.id)
      .eq("investor_id", user.id)
      .in("status", ["pendente", "aceito"])
      .maybeSingle();
    ownActiveInterestId = ownInterest?.id ?? null;
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
      <RecordVisit businessId={business.id} />

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-body text-xs font-medium text-primary">
            Verificado Îasy
          </span>
          {certificadoras.map((sigla) => (
            <span
              key={sigla}
              className="rounded-full bg-muted px-2 py-0.5 font-body text-xs text-muted-foreground"
            >
              {sigla}
            </span>
          ))}
          <span className="font-body text-xs text-muted-foreground">
            Verificado em {formatDate(business.verificado_em)}
          </span>
        </div>

        <h1 className="font-heading text-2xl">{business.nome}</h1>
        <p className="font-body text-sm text-muted-foreground">
          {(business.produtos ?? []).join(", ")} · {business.cidade_ibge}/{business.uf} ·{" "}
          {business.familias ?? 0} famílias
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 font-body text-sm">
          <span>Busca {formatBRL(Number(business.valor_busca))}</span>
          <span>Prazo {business.prazo_meses} meses</span>
          <span>Retorno proposto {business.retorno_proposto}% ao ano</span>
        </div>

        <p className="font-body text-sm text-muted-foreground">
          Nota Îasy — Ambiental {business.nota_a} · Social {business.nota_s} · Gestão{" "}
          {business.nota_g}
        </p>

        {business.recebe_visitas && (
          <span className="w-fit rounded-full bg-muted px-2 py-0.5 font-body text-xs text-muted-foreground">
            Recebe visitas
          </span>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <nav className="flex flex-wrap gap-2 border-b border-border pb-2" aria-label="Abas do negócio">
            {TABS.map((tab) => (
              <Link
                key={tab.id}
                href={`/negocios/${slug}?aba=${tab.id}`}
                className={
                  "rounded-full px-3 py-1.5 font-body text-sm " +
                  (aba === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground")
                }
              >
                {tab.label}
              </Link>
            ))}
            <Link
              href={`/negocios/${slug}/documentos`}
              className="rounded-full bg-muted px-3 py-1.5 font-body text-sm text-muted-foreground hover:text-foreground"
            >
              Documentos
            </Link>
          </nav>

          {aba === "producao" && (
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg">A produção</h2>
              <p className="font-body text-sm">
                Produzem: {(business.produtos ?? []).join(", ") || "—"}
              </p>
              {business.producao_mensal_kg != null && (
                <p className="font-body text-sm">
                  Produção mensal: {business.producao_mensal_kg} kg
                </p>
              )}
              <div>
                <h3 className="font-body text-sm font-medium">Como cuidam da floresta</h3>
                {business.praticas.length > 0 ? (
                  <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 font-body text-sm">
                    {business.praticas.map((pratica) => (
                      <li key={pratica}>{pratica}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-body text-sm text-muted-foreground">
                    Nenhuma prática informada.
                  </p>
                )}
              </div>
            </section>
          )}

          {aba !== "producao" && !canSeePrivateTabs && (
            <section className="flex flex-col items-start gap-3 rounded-lg bg-muted p-6">
              <p className="font-body text-sm">
                Você precisa entrar como investidor ou empresa para ver esta aba.
              </p>
              <Link
                href={`/entrar?redirect=${encodeURIComponent(`/negocios/${slug}?aba=${aba}`)}`}
                className="rounded-lg bg-primary px-4 py-2 font-body text-sm font-medium text-primary-foreground"
              >
                Entrar
              </Link>
            </section>
          )}

          {aba === "negocio" && canSeePrivateTabs && (
            <section className="flex flex-col gap-2">
              <h2 className="font-heading text-lg">O negócio</h2>
              <p className="font-body text-sm">
                {business.tipo_org ? TIPO_ORG_LABELS[business.tipo_org] ?? business.tipo_org : "—"}
              </p>
              <p className="font-body text-sm">
                {business.anos_atividade ?? 0} anos de atividade · {business.familias ?? 0} famílias
                envolvidas
              </p>
              <p className="font-body text-sm">
                {business.cidade_ibge}/{business.uf}
              </p>
            </section>
          )}

          {aba === "quem-cuida" && canSeePrivateTabs && (
            <section className="flex flex-col gap-2">
              <h2 className="font-heading text-lg">Quem cuida</h2>
              <ul className="flex flex-col gap-1 font-body text-sm">
                <li>
                  <span className="font-medium">{ownerProfile?.nome ?? "—"}</span> — Responsável
                  pelo negócio
                </li>
              </ul>
            </section>
          )}

          {aba === "dinheiro" && canSeePrivateTabs && (
            <section className="flex flex-col gap-2">
              <h2 className="font-heading text-lg">O dinheiro</h2>
              <p className="font-body text-sm">
                Finalidade:{" "}
                {business.finalidade
                  ? FINALIDADE_LABELS[business.finalidade] ?? business.finalidade
                  : "—"}
              </p>
              <p className="font-body text-sm">Busca {formatBRL(Number(business.valor_busca))}</p>
              <p className="font-body text-sm">Prazo {business.prazo_meses} meses</p>
              <p className="font-body text-sm">
                Retorno proposto {business.retorno_proposto}% ao ano
              </p>
              <p className="font-body text-xs text-muted-foreground">
                Retorno proposto pela produtora, sujeito às condições combinadas com o parceiro
                financeiro depois do aceite - não é garantia nem oferta pública de investimento.
              </p>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-3 rounded-lg bg-muted p-4">
          <div className="flex flex-col gap-2">
            <p className="font-body text-sm font-medium">Interesse de investidores</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${percentualBarra}%` }}
              />
            </div>
            <p className="font-body text-xs text-muted-foreground">
              {formatInterestSummary(somaAbsoluta, Number(business.valor_busca))}
            </p>
          </div>

          {!isOwner &&
            (!user ? (
              <Link
                href={`/entrar?redirect=${encodeURIComponent(`/negocios/${slug}?interesse=1`)}`}
                data-testid="botao-tenho-interesse"
                className="rounded-lg bg-primary px-4 py-2 text-center font-body text-sm font-medium text-primary-foreground"
              >
                Tenho interesse
              </Link>
            ) : role === "produtor" || role === "verificador" ? null : ownActiveInterestId ? (
              <Link
                href={`/negocios/${slug}/interesse-enviado?id=${ownActiveInterestId}`}
                data-testid="ver-meu-interesse"
                className="rounded-lg border border-input px-4 py-2 text-center font-body text-sm font-medium"
              >
                Ver meu interesse
              </Link>
            ) : (
              <InterestModal
                slug={slug}
                businessId={business.id}
                valorBusca={Number(business.valor_busca)}
                autoOpen={autoOpenInteresse}
              />
            ))}
        </aside>
      </div>
    </main>
  );
}
