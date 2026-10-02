import { cn } from "cn";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Gap de design: opções de produtos/práticas/impactos (PRO-04) eram
 * checkboxes soltos em lista vertical; o protótipo usa pills (produtos)
 * e cards (práticas/impactos) selecionáveis. Mantém um `<input
 * type=checkbox>` real por baixo (via `Checkbox` do base-ui), então
 * `getByRole("checkbox", {name:...})` continua funcionando - só a
 * casca visual muda.
 */
export function CheckboxPill({
  name,
  value,
  checked,
  onCheckedChange,
  disabled,
  variant = "pill",
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onCheckedChange: () => void;
  disabled?: boolean;
  variant?: "pill" | "card";
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 border font-body text-sm transition-colors",
        variant === "pill"
          ? "rounded-full px-3 py-1.5"
          : "w-full rounded-lg px-3 py-2.5",
        checked
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-white text-foreground hover:bg-muted",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <Checkbox
        name={name}
        value={value}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      {children}
    </label>
  );
}
