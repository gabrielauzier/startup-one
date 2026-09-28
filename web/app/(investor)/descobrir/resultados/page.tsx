import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateAlignment, type BusinessForMatching } from "@/lib/matching/score";
import { sortByAlignment } from "@/lib/matching/rank";
import { BusinessCard, type BusinessSummary } from "@/components/business/BusinessCard";
import { ConnectionFooter } from "@/components/shared/ConnectionFooter";
import { loadAnswers } from "../actions";
import {
  FAIXA_VALOR_OPTIONS,
  PRIORIDADE_OPTIONS,
} from "../questions-data";

const ALIGNMENT_THRESHOLD = 40;

type Filtro = "todos" | "com_selo" | "recebe_visitas";

interface BusinessRow {
  id: string;
  slug: string | null;
  nome: string | null;
  cidade_ibge: string | null;
  uf: string | null;
  produtos: string[];
  impactos: string[];
  valor_busca: number;
  prazo_meses: number;
  retorno_proposto: number;
  nota_a: number;
  nota_s: number;
  nota_g: number;
  recebe_visitas: boolean;
  verificado_em: string | null;
}

function chipsResumo(answers: Awaited<ReturnType<typeof loadAnswers>>): string[] {
  const chips: string[] = [];
  const prioridade = PRIORIDADE_OPTIONS.find((o) => o.value === answers.prioridade);
  if (prioridade) chips.push(prioridade.label);
  const faixa = FAIXA_VALOR_OPTIONS.find((o) => o.value === answers.faixaValor);
  if (faixa) chips.push(faixa.label);
  if (answers.produtos?.length) chips.push(answers.produtos.join(", "));
  if (answers.prazoMaxMeses) chips.push(`Até ${answers.prazoMaxMeses} meses`);
  chips.push(
    answers.impactos && answers.impactos.length > 0
      ? `${answers.impactos.length} impacto(s)`
      : "Sem critério de impacto"
  );
  return chips;
}

/**
 * RF-18/T08: negócios verificados ordenados por alinhamento (RN-24),
 * com corte de 40% (CA-24.2), chips do resumo das respostas e filtros
 * "Todos"/"Com selo"/"Recebe visitas" (RN-25, CA-25.1). Pública
 * (RN-26) - sem respostas completas, mostra um convite a responder.
 */
export default async function ResultadosPage(props: PageProps<"/descobrir/resultados">) {
  const searchParams = await props.searchParams;
  const filtroParam = searchParams.filtro;
  const filtro: Filtro =
    filtroParam === "com_selo" || filtroParam === "recebe_visitas" ? filtroParam : "todos";

  const answers = await loadAnswers();
  const hasCompleteAnswers = Boolean(
    answers.prioridade &&
      answers.faixaValor &&
      answers.produtos?.length &&
      answers.prazoMaxMeses
  );

  const supabase = await createServerClient();
  const { data: businessesData } = await supabase
    .from("businesses")
    .select(
      "id, slug, nome, cidade_ibge, uf, produtos, impactos, valor_busca, prazo_meses, retorno_proposto, nota_a, nota_s, nota_g, recebe_visitas, verificado_em"
    )
    .eq("status", "verificado");
  const businesses = (businessesData ?? []) as BusinessRow[];

  // certifications ainda nao tem policy propria (Handoff do T25) - le
  // via cliente admin, so' as conferidas (RN-20).
  const admin = createAdminClient();
  const { data: certificationsData } = await admin
    .from("certifications")
    .select("business_id, certificadora")
    .eq("conferido", true);

  const certsByBusiness = new Map<string, string[]>();
  for (const cert of certificationsData ?? []) {
    const list = certsByBusiness.get(cert.business_id) ?? [];
    list.push(cert.certificadora);
    certsByBusiness.set(cert.business_id, list);
  }

  let results: Array<{
    business: BusinessRow;
    alignment: number;
    certificadoras: string[];
  }> = [];

  if (hasCompleteAnswers) {
    results = businesses
      .map((business) => {
        const matchInput: BusinessForMatching = {
          produtos: business.produtos ?? [],
          valorBusca: Number(business.valor_busca),
          prazoMeses: business.prazo_meses,
          impactos: business.impactos ?? [],
          notaA: business.nota_a,
          notaS: business.nota_s,
          notaG: business.nota_g,
        };
        const alignment = calculateAlignment(
          {
            prioridade: answers.prioridade!,
            faixaValor: answers.faixaValor!,
            produtos: answers.produtos!,
            prazoMaxMeses: answers.prazoMaxMeses!,
            impactos: answers.impactos,
          },
          matchInput
        );
        return {
          business,
          alignment,
          certificadoras: certsByBusiness.get(business.id) ?? [],
        };
      })
      // RN-24/CA-24.2: só 40% ou mais entram nos resultados.
      .filter((r) => r.alignment >= ALIGNMENT_THRESHOLD);

    results = sortByAlignment(
      results.map((r) => ({
        ...r,
        notaA: r.business.nota_a,
        notaS: r.business.nota_s,
        notaG: r.business.nota_g,
        verificadoEm: r.business.verificado_em,
      }))
    );
  }

  // RN-25/CA-25.1: filtros "Com selo de certificadora" e "Recebe visitas".
  const filtered = results.filter((r) => {
    if (filtro === "com_selo") return r.certificadoras.length > 0;
    if (filtro === "recebe_visitas") return r.business.recebe_visitas;
    return true;
  });

  const FILTROS: { value: Filtro; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "com_selo", label: "Com selo de certificadora" },
    { value: "recebe_visitas", label: "Recebe visitas" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl">
          {filtered.length} negócios verificados alinhados ao seu perfil
        </h1>
        <Link href="/descobrir/1" className="font-body text-sm text-primary underline">
          Alterar respostas
        </Link>
      </div>

      {hasCompleteAnswers && (
        <div className="flex flex-wrap gap-2">
          {chipsResumo(answers).map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-muted px-3 py-1 font-body text-xs text-muted-foreground"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtros">
        {FILTROS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "todos" ? "/descobrir/resultados" : `/descobrir/resultados?filtro=${f.value}`}
            aria-current={filtro === f.value ? "true" : undefined}
            className={`rounded-full px-3 py-1 font-body text-sm ${
              filtro === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {!hasCompleteAnswers && (
        <p className="font-body text-sm text-muted-foreground">
          Responda as 5 perguntas para ver os negócios mais alinhados ao seu perfil.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map(({ business, alignment, certificadoras }) => {
          const summary: BusinessSummary = {
            slug: business.slug ?? business.id,
            nome: business.nome ?? "",
            cidade: business.cidade_ibge ?? "",
            uf: business.uf ?? "",
            produtos: business.produtos ?? [],
            valorBusca: Number(business.valor_busca),
            prazoMeses: business.prazo_meses,
            retornoProposto: Number(business.retorno_proposto),
            notaA: business.nota_a,
            notaS: business.nota_s,
            notaG: business.nota_g,
            certificadoras,
            recebeVisitas: business.recebe_visitas,
          };
          return <BusinessCard key={business.id} business={summary} alignment={alignment} />;
        })}
      </div>

      <ConnectionFooter />
    </main>
  );
}
