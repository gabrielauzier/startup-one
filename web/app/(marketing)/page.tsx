import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { FourSteps } from "@/components/marketing/FourSteps";
import { ConnectionFooter } from "@/components/shared/ConnectionFooter";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col items-center gap-12 bg-background px-6 py-24">
        <div className="max-w-2xl text-center">
          <h1 className="font-heading text-4xl text-primary">
            Negócios da Amazônia com visibilidade e transparência.
          </h1>
          <p className="mt-4 font-body text-lg text-foreground/80">
            Conectamos quem produz a quem quer investir. Organizamos e
            conferimos as informações de negócios amazônicos: produtores
            ganham credibilidade e investidores encontram negócios em que
            podem confiar.
          </p>
        </div>

        <FourSteps />

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/produtor" className={buttonVariants({ size: "lg" })}>
            Sou produtor, quero ser encontrado
          </Link>
          <Link
            href="/descobrir/1"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Sou investidor, quero conhecer negócios
          </Link>
        </div>
      </main>

      <ConnectionFooter />
    </div>
  );
}
