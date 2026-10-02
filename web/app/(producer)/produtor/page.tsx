import { Check, Moon } from "lucide-react";
import { Card } from "@/components/ui/card";
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
      <div className="flex items-center gap-2">
        <Moon className="size-5 fill-primary" aria-hidden />
        <span className="font-heading text-lg text-primary">Îasy</span>
      </div>

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
        <ul className="flex flex-col gap-1.5 font-body text-sm text-foreground/80">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            Um perfil verificado que mostra seus dados de forma organizada
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            Visibilidade para investidores de impacto interessados na Amazônia
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            Nenhum custo para se cadastrar ou aparecer na vitrine
          </li>
        </ul>
      </section>

      <Card className="gap-3 p-4">
        <h2 className="font-heading text-lg text-primary">Quem vê o quê</h2>
        <div className="flex flex-col gap-2">
          <div>
            <p className="font-body text-xs font-medium text-primary">Quem investe vê</p>
            <p className="font-body text-sm text-foreground/80">
              Nome do negócio, cidade, o que você produz, fotos e quanto você
              precisa.
            </p>
          </div>
          <div>
            <p className="font-body text-xs font-medium text-sky-700">
              Apenas com sua autorização
            </p>
            <p className="font-body text-sm text-foreground/80">
              Documentos da terra, laudos e certificados completos.
            </p>
          </div>
          <div>
            <p className="font-body text-xs font-medium text-destructive">Ninguém vê</p>
            <p className="font-body text-sm text-foreground/80">
              Seu telefone, e-mail ou CPF.
            </p>
          </div>
        </div>
      </Card>

      <BoasVindasForm partners={partners ?? []} />
    </main>
  );
}
