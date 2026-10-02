import { Typography } from "../ui/typography";

export function HelpBanner() {
  return (
    <div className="bg-primary text-primary-foreground p-10 rounded-4xl flex items-center gap-10 mt-10">
      <Typography size="heading-sm" color="inverse" variant="h2">
        Ajudamos a mostrar produtores de confiança e aos nossos investidores.
      </Typography>
      <Typography color="inverse" weight="semibold">
        Contrato, pagamento e retorno ficam com um parceiro financeiro
        autorizado, como um banco ou uma fintech. Organizamos, conferimos e
        aproximamos as partes.
      </Typography>
    </div>
  );
}
