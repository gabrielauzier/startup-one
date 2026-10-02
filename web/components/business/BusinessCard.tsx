import Link from "next/link";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { BusinessTonePlaceholder } from "./BusinessTonePlaceholder";
import { CertificationBadge } from "./CertificationBadge";
import { FinancialMetricsGrid } from "./FinancialMetricsGrid";

/**
 * RN-28: dados que o card de negocio precisa para renderizar. Reduzido
 * do que `businesses` guarda (schema completo em
 * supabase/migrations/0003_businesses.sql) - so' os campos publicos
 * exibidos em card, nunca dado sensivel (RN-31).
 */
export interface BusinessSummary {
  slug: string;
  nome: string;
  cidade: string;
  uf: string;
  produtos: string[];
  fotoUrl?: string | null;
  valorBusca: number;
  prazoMeses: number;
  retornoProposto: number;
  notaA: number;
  notaS: number;
  notaG: number;
  /** Siglas das certificadoras conferidas (RN-20) - vazio se nenhuma. */
  certificadoras: string[];
  recebeVisitas?: boolean;
  /** RN-29: soma de interesses Pendentes+Aceitos (lib/business/interest-sum.ts, T38). */
  interesseSomado?: number;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

/**
 * RF-20/RN-28: card unico de negocio, reutilizado em resultados (T36) e
 * na vitrine publica (T37). O card inteiro leva a' pagina do negocio.
 */
export function BusinessCard({
  business,
  alignment,
}: {
  business: BusinessSummary;
  alignment?: number;
}) {
  const interesseSomado = business.interesseSomado ?? 0;
  const barraPercent = Math.min(100, Math.round((interesseSomado / business.valorBusca) * 100));

  return (
    <Link href={`/negocios/${business.slug}`} className="block">
      <Card className="gap-3 p-0">
        <div className="flex h-40 w-full items-center justify-center overflow-hidden bg-muted">
          {business.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.fotoUrl}
              alt={business.nome}
              className="h-full w-full object-cover"
            />
          ) : (
            <BusinessTonePlaceholder seed={business.slug} className="h-full w-full" />
          )}
        </div>

        <div className="flex flex-col gap-2 px-4 pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Typography
              as="span"
              variant="caption"
              weight="medium"
              color="primary"
              className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5"
            >
              <Check className="size-3" aria-hidden /> Verificado Îasy
            </Typography>
            {business.certificadoras.map((sigla) => (
              <CertificationBadge key={sigla} sigla={sigla} />
            ))}
            {typeof alignment === "number" && (
              <Typography
                as="span"
                variant="caption"
                weight="medium"
                className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground"
              >
                {alignment}% alinhado ao seu perfil
              </Typography>
            )}
          </div>

          {/* as="h3" preserva a hierarquia (título do card dentro da
              listagem), com tamanho/peso próprios (base/medium) em vez
              do preset padrão de "h4" (lg/normal). */}
          <Typography as="h3" variant="h4" size="base" weight="medium">
            {business.nome}
          </Typography>
          <Typography variant="body" color="muted">
            {business.produtos.join(", ")} · {business.cidade}/{business.uf}
          </Typography>

          <FinancialMetricsGrid
            valorBusca={business.valorBusca}
            prazoMeses={business.prazoMeses}
            retornoProposto={business.retornoProposto}
          />

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Typography as="span" variant="caption" color="muted">
              Nota Îasy
            </Typography>
            <Typography as="span" variant="body">
              Ambiental {business.notaA}
            </Typography>
            <Typography as="span" variant="body">
              Social {business.notaS}
            </Typography>
            <Typography as="span" variant="body">
              Gestão {business.notaG}
            </Typography>
          </div>

          {business.recebeVisitas && (
            <Typography
              as="span"
              variant="caption"
              className="w-fit rounded-full bg-muted px-2 py-0.5"
            >
              Recebe visitas
            </Typography>
          )}

          <div className="flex flex-col gap-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${barraPercent}%` }}
              />
            </div>
            <Typography variant="caption">
              Interesse de investidores: {formatBRL(interesseSomado)} de{" "}
              {formatBRL(business.valorBusca)}
            </Typography>
          </div>
        </div>
      </Card>
    </Link>
  );
}
