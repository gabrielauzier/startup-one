import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { DocumentosAdicionaisForm } from "./documentos-adicionais-form";
import { listDocumentosAdicionais } from "./actions";

/**
 * RF-25: formulário para a produtora anexar laudo ambiental e
 * certificado completo depois do cadastro inicial - documento enviado
 * aparece na aba Documentos do negócio (T41) como "Precisa de
 * liberação", pronto para um investidor solicitar acesso.
 */
export default async function DocumentosAdicionaisPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?redirect=/produtor/painel/documentos-adicionais");
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

  const documentos = await listDocumentosAdicionais(business.id);
  const hasLaudo = documentos.some((d) => d.tipo === "laudo");
  const hasCertificado = documentos.some((d) => d.tipo === "certificado_completo");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl">Documentos adicionais</h1>
        <p className="font-body text-sm text-muted-foreground">
          Envie o laudo ambiental e o certificado completo quando estiverem prontos - eles
          aparecem na aba Documentos de {business.nome} para os investidores solicitarem acesso.
        </p>
      </div>

      <DocumentosAdicionaisForm
        businessId={business.id}
        hasLaudo={hasLaudo}
        hasCertificado={hasCertificado}
      />
    </main>
  );
}
