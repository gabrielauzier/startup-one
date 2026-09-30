import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConnectionFooter } from "@/components/shared/ConnectionFooter";
import { BottomNav } from "@/components/producer/BottomNav";
import { decideInterestForm } from "./actions";

interface InterestRow {
  id: string;
  investor_id: string;
  valor: number;
  mensagem: string | null;
  status: "pendente" | "aceito" | "recusado" | "expirado" | "cancelado";
  created_at: string;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("pt-BR");
}

const STATUS_LABEL: Record<InterestRow["status"], string> = {
  pendente: "Novo",
  aceito: "Aceito",
  recusado: "Não aceito pela produtora",
  expirado: "Pedido expirado",
  cancelado: "Cancelado pelo investidor",
};

/**
 * RF-28/RN-39: "Quem tem interesse" - lista os interesses do negócio
 * da produtora com perfil/data/situação/valor/mensagem. "Aceitar e
 * seguir" (CA-39.1) e "Recusar" (CA-39.2, sem revelar motivo/contato
 * ao investidor) só aparecem para interesses Novos (`pendente`). Rota
 * já protegida pelo middleware (`/produtor` -> role `produtor`,
 * lib/auth/roles.ts).
 */
export default async function InteressesPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?redirect=/produtor/interesses");
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

  const { data: interestsData } = await supabase
    .from("interests")
    .select("id, investor_id, valor, mensagem, status, created_at")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });
  const interests = (interestsData ?? []) as InterestRow[];

  const investorIds = Array.from(new Set(interests.map((i) => i.investor_id)));
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

  const novos = interests.filter((i) => i.status === "pendente");
  const decididos = interests.filter((i) => i.status !== "pendente");

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <h1 className="font-heading text-2xl">Quem tem interesse</h1>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg">Novos</h2>
        {novos.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">
            Nenhum interesse novo por enquanto.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {novos.map((interest) => (
              <li
                key={interest.id}
                data-testid="interesse-novo"
                className="flex flex-col gap-2 rounded-lg bg-muted p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-body text-sm font-medium">
                    {investorNameById.get(interest.investor_id) ?? "Investidor"} ·{" "}
                    {formatBRL(Number(interest.valor))}
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    {formatDate(interest.created_at)}
                  </p>
                </div>
                {interest.mensagem && (
                  <p className="font-body text-sm">{interest.mensagem}</p>
                )}
                <div className="flex gap-2">
                  <form action={decideInterestForm.bind(null, interest.id, "aceitar")}>
                    <button
                      type="submit"
                      data-testid="aceitar-interesse"
                      className="rounded-lg bg-primary px-3 py-1.5 font-body text-sm font-medium text-primary-foreground"
                    >
                      Aceitar e seguir
                    </button>
                  </form>
                  <form action={decideInterestForm.bind(null, interest.id, "recusar")}>
                    <button
                      type="submit"
                      data-testid="recusar-interesse"
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
        {decididos.length === 0 ? (
          <p className="font-body text-sm text-muted-foreground">
            Nenhum interesse decidido ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {decididos.map((interest) => (
              <li
                key={interest.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted p-4"
              >
                <p className="font-body text-sm font-medium">
                  {investorNameById.get(interest.investor_id) ?? "Investidor"} ·{" "}
                  {formatBRL(Number(interest.valor))}
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  {STATUS_LABEL[interest.status]}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConnectionFooter />
      <BottomNav />
    </main>
  );
}
