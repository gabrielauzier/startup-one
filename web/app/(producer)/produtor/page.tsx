import { createAdminClient } from "@/lib/supabase/admin";
import { BoasVindasForm } from "./boas-vindas-form";

/**
 * RF-05/HU-04: boas-vindas do produtor - o que ganha, "Quem vê o quê" e
 * a pergunta de indicação por cooperativa/ONG (RN-11) antes de começar
 * o cadastro de 5 partes.
 */
export default async function ProdutorBoasVindasPage() {
  const admin = createAdminClient();
  const { data: partners } = await admin
    .from("partners")
    .select("id, nome")
    .eq("tipo", "indicador")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="font-heading text-3xl text-primary">
          Seja bem-vinda à Îasy
        </h1>
        <p className="mt-2 font-body text-sm text-foreground/70">
          Um cadastro simples, pelo celular, para mostrar seu negócio a
          investidores de impacto.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg text-primary">O que você ganha</h2>
        <ul className="list-disc pl-5 font-body text-sm text-foreground/80">
          <li>Um perfil verificado que mostra seus dados de forma organizada</li>
          <li>Visibilidade para investidores de impacto interessados na Amazônia</li>
          <li>Nenhum custo para se cadastrar ou aparecer na vitrine</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg text-primary">Quem vê o quê</h2>
        <p className="font-body text-sm text-foreground/80">
          Investidores veem nome do negócio, cidade, o que você produz, fotos
          e quanto você precisa. Documentos da terra, laudos e certificados
          completos só são liberados com a sua autorização. Ninguém vê seu
          telefone, e-mail ou CPF.
        </p>
      </section>

      <BoasVindasForm partners={partners ?? []} />
    </main>
  );
}
