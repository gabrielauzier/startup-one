"use client";

import { useState, type ComponentProps } from "react";
import { Input } from "@/components/ui/input";

/**
 * Campo de senha com "Mostrar/Ocultar" (AUTH-05). `autoComplete`
 * obrigatorio: `current-password` no login, `new-password` em cadastro e
 * redefinicao.
 */
export function PasswordInput({
  autoComplete,
  ...props
}: Omit<ComponentProps<"input">, "type" | "autoComplete"> & {
  autoComplete: "current-password" | "new-password";
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        className="h-11 pr-20 md:h-11"
      />
      <button
        type="button"
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 min-w-11 px-3 font-body text-sm text-primary"
      >
        {visible ? "Ocultar" : "Mostrar"}
      </button>
    </div>
  );
}
