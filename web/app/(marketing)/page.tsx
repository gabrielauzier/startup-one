import Link from "next/link";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { FourSteps } from "@/components/marketing/FourSteps";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BusinessCard,
  type BusinessSummary,
} from "@/components/business/BusinessCard";
import { HelpBanner } from "@/components/marketing/HelpBanner";

interface FeaturedBusinessRow {
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

/**
 * Gap de layout (página inicial): o protótipo mostra 1 negócio em
 * destaque ao lado do hero - o mais recém-verificado, mesmo card já
 * usado na vitrine/resultados (`BusinessCard`). Sem negócio verificado
 * ainda (banco vazio), o hero fica sozinho.
 */
async function getFeaturedBusiness(): Promise<BusinessSummary | null> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("businesses")
    .select(
      "id, slug, nome, cidade_ibge, uf, produtos, valor_busca, prazo_meses, retorno_proposto, nota_a, nota_s, nota_g, recebe_visitas",
    )
    .eq("status", "verificado")
    .order("verificado_em", { ascending: false })
    .limit(1)
    .maybeSingle<FeaturedBusinessRow>();

  if (!data || !data.slug || !data.nome) return null;

  const admin = createAdminClient();
  const { data: certificationsData } = await admin
    .from("certifications")
    .select("certificadora")
    .eq("business_id", data.id)
    .eq("conferido", true);

  return {
    slug: data.slug,
    nome: data.nome,
    cidade: data.cidade_ibge ?? "",
    uf: data.uf ?? "",
    produtos: data.produtos ?? [],
    valorBusca: data.valor_busca,
    prazoMeses: data.prazo_meses,
    retornoProposto: data.retorno_proposto,
    notaA: data.nota_a,
    notaS: data.nota_s,
    notaG: data.nota_g,
    certificadoras: (certificationsData ?? []).map(
      (c) => c.certificadora as string,
    ),
    recebeVisitas: data.recebe_visitas,
  };
}

export default async function Home() {
  const featured = await getFeaturedBusiness();

  return (
    <main className="flex flex-1 flex-col items-center gap-16 bg-background px-6 py-16">
      <div
        className={`mx-auto flex w-full max-w-5xl flex-col items-center gap-10 ${
          featured ? "lg:flex-row lg:items-center lg:text-left" : ""
        }`}
      >
        <div
          className={`max-w-2xl text-center ${featured ? "lg:text-left" : ""}`}
        >
          <Typography size="sm" weight="semibold" color="tertiary">
            Negócios da floresta com informação confiável
          </Typography>
          <Typography variant="h2" size="heading-lg" className="mt-6">
            Conectamos quem produz a quem quer investir.
          </Typography>
          <Typography
            variant="body"
            size="lg"
            className="mt-4 text-foreground/80"
          >
            Organizamos e conferimos as informações de negócios amazônicos.
            Produtores ganham credibilidade e investidores encontram negócios em
            que podem confiar.
          </Typography>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/produtor"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Sou produtor, quero ser encontrado
            </Link>
            <Link
              href="/descobrir/1"
              className={cn(buttonVariants({ size: "lg", variant: "outline" }))}
            >
              Sou investidor, quero conhecer negócios
            </Link>
          </div>
        </div>

        {featured && (
          <div className="w-full max-w-sm shrink-0">
            <BusinessCard business={featured} />
          </div>
        )}
      </div>

      <div
        id="como-funciona"
        className="flex flex-col mx-auto max-w-5xl w-full gap-6 scroll-mt-20"
      >
        {/* as="h2" preserva a hierarquia semântica (h1 -> h2) mesmo usando
            o estilo visual do variant "h3" (2xl) - exatamente o ponto de
            `as` ser independente de `variant`. */}
        <Typography
          as="h2"
          variant="h3"
          color="default"
          size="heading-sm"
          weight="medium"
        >
          Como funciona
        </Typography>
        <FourSteps />
        <HelpBanner />
      </div>
    </main>
  );
}
