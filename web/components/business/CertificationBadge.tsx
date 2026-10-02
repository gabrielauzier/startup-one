import { Typography } from "@/components/ui/typography";

/**
 * Gap de design: o protótipo mostra as certificadoras como selo circular
 * (ex. "OB", "FT"). `certifications.certificadora` hoje é um único campo
 * de texto livre (ex. "IBD", "FSC") - sem nome completo separado no
 * schema, então o badge só reproduz o estilo circular, sem inventar
 * texto que não existe no banco.
 */
export function CertificationBadge({ sigla }: { sigla: string }) {
  return (
    <Typography
      as="span"
      variant="caption"
      weight="medium"
      className="flex h-7 min-w-7 items-center justify-center rounded-full border border-border bg-white px-1.5"
    >
      {sigla}
    </Typography>
  );
}
