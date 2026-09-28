import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AnaliseForm } from "./AnaliseForm";
import { HistoryPanel } from "./HistoryPanel";

/**
 * RF-15/RN-18 a RN-21: dados e evidencias lado a lado, checklist,
 * conferencia de selos, notas A/S/G, motivo e as acoes Aprovar/Pedir
 * ajuste/Reprovar. `businesses` le pelo cliente de sessao (RLS do T25
 * ja cobre "verificador ve tudo"); evidencias/certificacoes/revisoes
 * ainda nao tem policy propria, usa o cliente admin.
 */
export default async function AnalisePage({
  params,
}: PageProps<"/verificacao/[id]">) {
  const { id } = await params;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, nome, cnpj, cidade_ibge, uf, familias, anos_atividade, produtos, producao_mensal_kg, praticas, impactos, status"
    )
    .eq("id", id)
    .maybeSingle();

  if (!business) {
    notFound();
  }

  const admin = createAdminClient();

  const { data: evidenceRows } = await admin
    .from("evidences")
    .select("id, grupo, storage_path")
    .eq("business_id", id);

  const { data: certificationRows } = await admin
    .from("certifications")
    .select("id, certificadora, conferido")
    .eq("business_id", id);

  const { data: verificationRows } = await admin
    .from("verifications")
    .select("id, decisao, motivo, checklist, itens_ajuste, created_at, verifier_id")
    .eq("business_id", id)
    .order("created_at", { ascending: false });

  const evidenceCounts = {
    onde_produz: (evidenceRows ?? []).filter((e) => e.grupo === "onde_produz").length,
    produto: (evidenceRows ?? []).filter((e) => e.grupo === "produto").length,
    terra: (evidenceRows ?? []).filter((e) => e.grupo === "terra").length,
    selo: (evidenceRows ?? []).filter((e) => e.grupo === "selo").length,
  };

  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <p className="font-body text-sm text-foreground/70">Análise</p>
        <h1 className="mt-2 font-heading text-2xl text-primary">
          {business.nome ?? "Negócio"}
        </h1>
        <p className="font-body text-sm text-foreground/70">Status: {business.status}</p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-md border border-border p-4">
          <h2 className="font-heading text-lg text-primary">Dados</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 font-body text-sm">
            <dt className="text-foreground/70">CNPJ</dt>
            <dd>{business.cnpj ?? "—"}</dd>
            <dt className="text-foreground/70">Cidade/UF</dt>
            <dd>
              {business.cidade_ibge ?? "—"}/{business.uf ?? "—"}
            </dd>
            <dt className="text-foreground/70">Famílias</dt>
            <dd>{business.familias ?? "—"}</dd>
            <dt className="text-foreground/70">Anos de atividade</dt>
            <dd>{business.anos_atividade ?? "—"}</dd>
            <dt className="text-foreground/70">Produtos</dt>
            <dd>{(business.produtos ?? []).join(", ") || "—"}</dd>
            <dt className="text-foreground/70">Produção mensal (kg)</dt>
            <dd>{business.producao_mensal_kg ?? "—"}</dd>
            <dt className="text-foreground/70">Práticas</dt>
            <dd>{(business.praticas ?? []).join(", ") || "—"}</dd>
          </dl>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-border p-4">
          <h2 className="font-heading text-lg text-primary">Evidências</h2>
          <ul className="font-body text-sm">
            <li>Onde produz: {evidenceCounts.onde_produz} foto(s)</li>
            <li>Produto: {evidenceCounts.produto} foto(s)</li>
            <li>Documento da terra: {evidenceCounts.terra} arquivo(s)</li>
            <li>Selos de certificadora: {evidenceCounts.selo} arquivo(s)</li>
          </ul>

          <h3 className="mt-2 font-heading text-base text-primary">
            Selos de certificadora
          </h3>
          {(certificationRows ?? []).length === 0 ? (
            <p className="font-body text-sm text-foreground/70">Nenhum selo enviado.</p>
          ) : (
            <ul className="font-body text-sm">
              {(certificationRows ?? []).map((c) => (
                <li key={c.id}>
                  {c.certificadora} — {c.conferido ? "conferido" : "não conferido"}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <AnaliseForm
        businessId={business.id}
        hasTerraEvidence={evidenceCounts.terra > 0}
        certifications={(certificationRows ?? []).map((c) => ({
          id: c.id,
          certificadora: c.certificadora,
          conferido: c.conferido,
        }))}
      />

      <HistoryPanel
        entries={(verificationRows ?? []).map((v) => ({
          id: v.id,
          decisao: v.decisao,
          motivo: v.motivo,
          createdAt: v.created_at,
        }))}
      />
    </main>
  );
}
