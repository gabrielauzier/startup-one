import Link from "next/link";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";

/** RF-12/HU-09: confirmação do envio, com prazo de 5 dias úteis e os próximos passos. */
export default function CadastroEnviadoPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-24 text-center">
      <h1 className="font-heading text-3xl text-primary">Recebemos seu cadastro</h1>
      <p className="font-body text-sm text-foreground/80">
        Nossa equipe analisa seu cadastro em até 5 dias úteis.
      </p>

      <ol className="flex flex-col gap-3 text-left font-body text-sm text-foreground/80">
        <li>1. A equipe Îasy confere seus dados e documentos.</li>
        <li>2. Se precisarmos de algo a mais, avisamos por e-mail e WhatsApp.</li>
        <li>3. Quando aprovado, seu negócio recebe o selo Verificado Îasy e aparece na vitrine.</li>
      </ol>

      <Link href="/produtor/painel" className={cn(buttonVariants({}))}>
        Ir para o meu painel
      </Link>
    </main>
  );
}
