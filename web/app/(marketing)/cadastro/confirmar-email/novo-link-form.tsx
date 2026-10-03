"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { resendConfirmation, type SendLinkState } from "@/app/(marketing)/entrar/magic-link-actions";

const INITIAL: SendLinkState = {};

/** Link vencido aberto em outro navegador (sem cookie de contexto): pede o e-mail de novo. */
export function NovoLinkForm() {
  const [state, formAction, pending] = useActionState(resendConfirmation, INITIAL);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="novo-link-email" className="font-body text-sm font-medium">
        E-mail do cadastro
      </label>
      <Input
        id="novo-link-email"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        required
        className="h-11 md:h-11"
      />
      <div role="alert">
        {state.error && (
          <Typography variant="body" size="sm" color="destructive">
            {state.error}
          </Typography>
        )}
      </div>
      <Button type="submit" size="lg" disabled={pending} className="h-11">
        Enviar novo link
      </Button>
    </form>
  );
}
