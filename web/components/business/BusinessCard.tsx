import Link from "next/link";
import { Card } from "@/components/ui/card";

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
            <span className="font-body text-xs text-muted-foreground">Sem foto</span>
          )}
        </div>

        <div className="flex flex-col gap-2 px-4 pb-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-body text-xs font-medium text-primary">
              Verificado Îasy
            </span>
            {business.certificadoras.map((sigla) => (
              <span
                key={sigla}
                className="rounded-full bg-muted px-2 py-0.5 font-body text-xs text-muted-foreground"
              >
                {sigla}
              </span>
            ))}
            {typeof alignment === "number" && (
              <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 font-body text-xs font-medium text-secondary-foreground">
                {alignment}% alinhado ao seu perfil
              </span>
            )}
          </div>

          <h3 className="font-heading text-base font-medium">{business.nome}</h3>
          <p className="font-body text-sm text-muted-foreground">
            {business.produtos.join(", ")} · {business.cidade}/{business.uf}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 font-body text-sm">
            <span>Busca {formatBRL(business.valorBusca)}</span>
            <span>Prazo {business.prazoMeses} meses</span>
            <span>Retorno proposto {business.retornoProposto}% ao ano</span>
          </div>

          <p className="font-body text-sm text-muted-foreground">
            Nota Îasy — Ambiental {business.notaA} · Social {business.notaS} · Gestão{" "}
            {business.notaG}
          </p>

          {business.recebeVisitas && (
            <span className="w-fit rounded-full bg-muted px-2 py-0.5 font-body text-xs text-muted-foreground">
              Recebe visitas
            </span>
          )}

          <div className="flex flex-col gap-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${barraPercent}%` }}
              />
            </div>
            <p className="font-body text-xs text-muted-foreground">
              Interesse de investidores: {formatBRL(interesseSomado)} de{" "}
              {formatBRL(business.valorBusca)}
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
