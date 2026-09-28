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
    <ol className="grid w-full max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {STEPS.map((step, index) => (
        <li
          key={step.title}
          className="rounded-lg border border-border bg-card p-4 text-left"
        >
          <span className="font-heading text-2xl text-primary">
            {index + 1}
          </span>
          <h3 className="mt-2 font-heading text-lg text-primary">
            {step.title}
          </h3>
          <p className="mt-1 font-body text-sm text-foreground/80">
            {step.description}
          </p>
        </li>
      ))}
    </ol>
  );
}
