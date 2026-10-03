"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { requestReset, type RequestResetState } from "./actions";

const INITIAL: RequestResetState = {};

export function EsqueciSenhaForm() {
  const [state, formAction, pending] = useActionState(requestReset, INITIAL);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <Typography as="h1" variant="h2" color="primary">
          Esqueci minha senha
        </Typography>
        <Typography variant="body" className="mt-2 text-foreground/70">
          Informe seu e-mail. Se existir uma conta, enviamos um código de 6 dígitos para você
          criar uma nova senha.
        </Typography>
      </div>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="esqueci-email" className="font-body text-sm font-medium">
            E-mail
          </label>
          <Input
            id="esqueci-email"
            type="email"
            name="email"
            placeholder="seu@email.com"
            autoComplete="email"
            inputMode="email"
            autoFocus
            required
            aria-invalid={state.error ? true : undefined}
            className="h-11 md:h-11"
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
          {pending ? "Enviando…" : "Enviar código"}
        </Button>
      </form>

      <Typography variant="body" size="sm">
        <Link href="/entrar" className="text-primary underline-offset-4 hover:underline">
          Voltar para entrar
        </Link>
      </Typography>
    </main>
  );
}
