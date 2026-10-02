import { Typography } from "@/components/ui/typography";

const STEPS = [
  {
    title: "Organizar",
    description:
      "O produtor registra pelo celular a produção, fotos e documentos da terra. Até a foto do caderno vale.",
  },
  {
    title: "Verificar",
    description:
      "A equipe confere cada informação e concede o selo Verificado Îasy, com notas Ambiental, Social e Gestão.",
  },
  {
    title: "Encontrar",
    description:
      "O investidor responde cinco perguntas e vê primeiro os negócios alinhados ao que busca.",
  },
  {
    title: "Conectar",
    description:
      "O produtor decide quem acessa seus documentos. Com interesse dos dois lados, a Îasy apresenta um parceiro financeiro para o contrato.",
  },
];

export function FourSteps() {
  return (
    <ol className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, index) => (
        <li
          key={step.title}
          className="rounded-lg border border-border bg-card p-4 text-left"
        >
          <Typography
            as="span"
            size="lg"
            variant="h3"
            color="tertiary"
            weight="medium"
          >
            {(index + 1).toString().padStart(2, "0")}
          </Typography>
          {/* as="h3" preserva a hierarquia (h1 > h2 "Como funciona" > h3
              por item), com o estilo do variant "h4" (lg). */}
          <Typography
            as="h3"
            size="xl"
            color="default"
            weight="semibold"
            className="mt-2"
          >
            {step.title}
          </Typography>
          <Typography variant="body" className="mt-3 text-foreground/80">
            {step.description}
          </Typography>
        </li>
      ))}
    </ol>
  );
}
