import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Watermark } from "@/components/documents/Watermark";
import { ProtectedViewer } from "@/components/documents/ProtectedViewer";
import { viewDocument } from "../../actions";

function isImagePath(path: string): boolean {
  return /\.(jpe?g|png|heic|webp)$/i.test(path);
}

/**
 * RF-24/RN-34/RN-35/CA-34.1/CA-34.2/CA-35.1: leitor em tela cheia -
 * sem opção de baixar/imprimir/copiar (menu de contexto bloqueado,
 * PDF embutido com toolbar do navegador escondida via `#toolbar=0`),
 * marca d'água "Visualizado por [nome] em [data]", URL assinada de 5
 * minutos gerada só nesta abertura (AD-007). `viewDocument`
 * (../../actions.ts) já grava `document_views` antes de tentar gerar a
 * URL, então a visualização conta mesmo se o Storage falhar.
 */
export default async function VerDocumentoPage(
  props: PageProps<"/negocios/[slug]/documentos/[id]/ver">
) {
  const { slug, id } = await props.params;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/entrar?redirect=${encodeURIComponent(`/negocios/${slug}/documentos/${id}/ver`)}`);
  }

  const result = await viewDocument(id);

  if (!result.authorized) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <h1 className="font-heading text-xl">{result.authError ?? "Você não tem acesso a este documento."}</h1>
        <Link
          href={`/negocios/${slug}/documentos`}
          className="font-body text-sm text-primary underline"
        >
          Voltar para Documentos
        </Link>
      </main>
    );
  }

  const dataFormatada = new Date().toLocaleString("pt-BR");

  return (
    <main className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <Link
          href={`/negocios/${slug}/documentos`}
          className="font-body text-sm text-muted-foreground underline"
        >
          Fechar
        </Link>
        <p className="font-body text-xs text-muted-foreground">
          Visualização protegida — sem download, impressão ou cópia
        </p>
      </div>

      <ProtectedViewer>
        <Watermark nome={result.nome ?? "Investidor"} dataFormatada={dataFormatada} />

        {result.signedUrl ? (
          isImagePath(result.signedUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.signedUrl}
              alt="Documento"
              className="h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <iframe
              src={`${result.signedUrl}#toolbar=0&navpanes=0`}
              title="Documento"
              className="h-full w-full border-0"
            />
          )
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="font-body text-sm text-muted-foreground">
              {result.storageError ?? "Não foi possível carregar o documento agora."}
            </p>
          </div>
        )}
      </ProtectedViewer>
    </main>
  );
}
