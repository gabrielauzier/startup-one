import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BusinessCard, type BusinessSummary } from "@/components/business/BusinessCard";
import { PRODUTOS_OPTIONS } from "@/lib/business/impact-options";
import { AMAZONIA_LEGAL_UFS } from "@/lib/validation/amazonia-legal";

interface BusinessRow {
  id: string;
  slug: string | null;
  nome: string | null;
  cidade_ibge: string | null;
  uf: string | null;
  produtos: string[];
  valor_busca: number;
  prazo_meses: number;
  retorno_proposto: number;
  nota_a: number;
  nota_s: number;
  nota_g: number;
  recebe_visitas: boolean;
}

/** RN-27: busca ignorando maiúsculas e acentos. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * RF-19/RN-26/RN-27: vitrine pública dos negócios Verificado Îasy -
 * busca por nome/cidade sem diferenciar maiúsculas/acentos, filtros de
 * produto e estado combinados e mantidos na URL, contador "N
 * negócios", estado vazio com "Limpar filtros" (CA-27.1, CA-27.2).
 */
export default async function NegociosPage(props: PageProps<"/negocios">) {
  const searchParams = await props.searchParams;
  const q = firstParam(searchParams.q);
  const produto = firstParam(searchParams.produto);
  const uf = firstParam(searchParams.uf);

  const supabase = await createServerClient();
  const { data: businessesData } = await supabase
    .from("businesses")
    .select(
      "id, slug, nome, cidade_ibge, uf, produtos, valor_busca, prazo_meses, retorno_proposto, nota_a, nota_s, nota_g, recebe_visitas"
    )
    .eq("status", "verificado");
  const businesses = (businessesData ?? []) as BusinessRow[];

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

  const normalizedQuery = normalize(q);
  const filtered = businesses.filter((business) => {
    if (normalizedQuery) {
      const haystack = normalize(`${business.nome ?? ""} ${business.cidade_ibge ?? ""}`);
      if (!haystack.includes(normalizedQuery)) return false;
    }
    if (produto && !(business.produtos ?? []).includes(produto)) return false;
    if (uf && business.uf !== uf) return false;
    return true;
  });

  const hasActiveFilters = Boolean(q || produto || uf);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="font-heading text-2xl">Negócios verificados</h1>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="font-body text-sm font-medium">
            Buscar por nome ou cidade
          </label>
          <input
            id="q"
            name="q"
            type="text"
            defaultValue={q}
            className="rounded-md border border-border bg-white px-3 py-2 font-body text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="produto" className="font-body text-sm font-medium">
            Produto
          </label>
          <select
            id="produto"
            name="produto"
            defaultValue={produto}
            className="rounded-md border border-border bg-white px-3 py-2 font-body text-sm"
          >
            <option value="">Todos</option>
            {PRODUTOS_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="uf" className="font-body text-sm font-medium">
            Estado
          </label>
          <select
            id="uf"
            name="uf"
            defaultValue={uf}
            className="rounded-md border border-border bg-white px-3 py-2 font-body text-sm"
          >
            <option value="">Todos</option>
            {AMAZONIA_LEGAL_UFS.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 font-body text-sm font-medium text-primary-foreground"
        >
          Buscar
        </button>
      </form>

      <p className="font-body text-sm text-muted-foreground">{filtered.length} negócios</p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-start gap-2">
          <p className="font-body text-sm">Nenhum negócio encontrado</p>
          <Link href="/negocios" className="font-body text-sm text-primary underline">
            Limpar filtros
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((business) => {
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
              certificadoras: certsByBusiness.get(business.id) ?? [],
              recebeVisitas: business.recebe_visitas,
            };
            return <BusinessCard key={business.id} business={summary} />;
          })}
        </div>
      )}

      {hasActiveFilters && filtered.length > 0 && (
        <Link href="/negocios" className="font-body text-sm text-primary underline">
          Limpar filtros
        </Link>
      )}
    </main>
  );
}
