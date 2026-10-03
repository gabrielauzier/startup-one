"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { verifyResetCode, type VerifyResetState } from "./actions";

const INITIAL: VerifyResetState = {};

export function CodigoForm() {
  const [state, formAction, pending] = useActionState(verifyResetCode, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="reset-codigo" className="font-body text-sm font-medium">
          Código de 6 dígitos
        </label>
        <Input
          id="reset-codigo"
          type="text"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          autoFocus
          required
          // AUTH-08.9: colar "123 456" mantem so' os 6 digitos (o maxLength truncaria o espaco).
          onPaste={(e) => {
            const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
            if (digits) {
              e.preventDefault();
              e.currentTarget.value = digits;
            }
          }}
          aria-invalid={state.error ? true : undefined}
          className="h-11 text-center tracking-[0.5em] md:h-11"
        />
      </div>

      <div role="alert" aria-live="assertive">
        {state.error && (
          <Typography variant="body" color="destructive">
            {state.error}
          </Typography>
        )}
      </div>

      <Button type="submit" size="lg" disabled={pending} className="h-11">
        {pending ? "Confirmando…" : "Confirmar"}
      </Button>
    </form>
  );
}
