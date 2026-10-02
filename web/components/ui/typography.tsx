import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "cn";

export type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "body"
  | "bodyLarge"
  | "caption"
  | "label"
  | "link";

export type TypographySize =
  | "xs"
  | "sm"
  | "base"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "heading-sm"
  | "heading-md"
  | "heading-lg";

/**
 * "light"/"semibold"/"bold" não têm uso real no código hoje (levantamento
 * via grep: só "normal" implícito e "font-medium" aparecem) - entram aqui
 * como pesos disponíveis por pedido explícito, não porque já existem em
 * algum lugar.
 */
export type TypographyWeight =
  | "light"
  | "normal"
  | "medium"
  | "semibold"
  | "bold";

/** "inverse" = texto sobre fundo colorido (ex.: botão primary, faixa verde). */
export type TypographyColor =
  | "default"
  | "muted"
  | "primary"
  | "destructive"
  | "inverse"
  | "tertiary";

const SIZE_CLASSES: Record<TypographySize, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "heading-sm": "text-4xl",
  "heading-md": "text-5xl",
  "heading-lg": "text-6xl",
};

const WEIGHT_CLASSES: Record<TypographyWeight, string> = {
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

const COLOR_CLASSES: Record<TypographyColor, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  primary: "text-primary",
  destructive: "text-destructive",
  inverse: "text-primary-foreground",
  tertiary: "text-tertiary-foreground",
};

interface VariantPreset {
  as: ElementType;
  font: "heading" | "body";
  size: TypographySize;
  weight: TypographyWeight;
  color: TypographyColor;
}

/**
 * Conjuntos pré-definidos de as/tamanho/peso/cor, levantados do uso real
 * do app (ver components/ui/__tests__/typography.test.tsx e o histórico
 * de decisão) - "variant" empacota os outros eixos, mas cada um continua
 * sobrescrevível individualmente.
 */
const VARIANT_PRESETS: Record<TypographyVariant, VariantPreset> = {
  h1: {
    as: "h1",
    font: "heading",
    size: "4xl",
    weight: "normal",
    color: "default",
  },
  h2: {
    as: "h2",
    font: "heading",
    size: "3xl",
    weight: "medium",
    color: "default",
  },
  h3: {
    as: "h3",
    font: "heading",
    size: "2xl",
    weight: "normal",
    color: "default",
  },
  h4: {
    as: "h4",
    font: "heading",
    size: "lg",
    weight: "normal",
    color: "default",
  },
  body: {
    as: "p",
    font: "body",
    size: "sm",
    weight: "normal",
    color: "default",
  },
  bodyLarge: {
    as: "p",
    font: "body",
    size: "base",
    weight: "normal",
    color: "default",
  },
  caption: {
    as: "span",
    font: "body",
    size: "xs",
    weight: "normal",
    color: "muted",
  },
  label: {
    as: "label",
    font: "body",
    size: "sm",
    weight: "medium",
    color: "default",
  },
  link: {
    as: "span",
    font: "body",
    size: "sm",
    weight: "normal",
    color: "primary",
  },
};

export interface TypographyProps extends Omit<
  ComponentPropsWithoutRef<"p">,
  "color"
> {
  as?: ElementType;
  variant?: TypographyVariant;
  size?: TypographySize;
  weight?: TypographyWeight;
  color?: TypographyColor;
  children?: ReactNode;
  /** Só relevante quando `as="label"`. */
  htmlFor?: string;
}

/**
 * Componente genérico de texto - substitui as combinações soltas de
 * `font-heading`/`font-body` + `text-*` + `text-{cor}` repetidas pelo
 * app. `as` sempre define a tag renderizada (independente do `variant`,
 * que só dá o valor padrão quando `as` não é passado); `size`/`weight`/
 * `color` explícitos sobrescrevem o preset do `variant` eixo a eixo.
 */
export function Typography({
  as,
  variant = "body",
  size,
  weight,
  color,
  className,
  children,
  ...props
}: TypographyProps) {
  const preset = VARIANT_PRESETS[variant];
  const Tag = as ?? preset.as;
  const fontClass = preset.font === "heading" ? "font-heading" : "font-body";

  return (
    <Tag
      data-slot="typography"
      className={cn(
        fontClass,
        SIZE_CLASSES[size ?? preset.size],
        WEIGHT_CLASSES[weight ?? preset.weight],
        COLOR_CLASSES[color ?? preset.color],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
