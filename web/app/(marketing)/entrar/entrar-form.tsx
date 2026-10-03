"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { signInPassword, type SignInState } from "./actions";
import {
  requestMagicLink,
  resendConfirmation,
  type SendLinkState,
} from "./magic-link-actions";

const INITIAL_SIGN_IN: SignInState = {};
const INITIAL_LINK: SendLinkState = {};

export type EntrarNotice =
  | "continuar"
  | "sem-permissao"
  | "senha-alterada"
  | "link-expirado"
  | null;

const NOTICE_TEXT: Record<Exclude<EntrarNotice, null>, string> = {
  continuar: "Entre para continuar.",
  "sem-permissao": "Essa área é de outro perfil. Entre com a conta certa ou volte.",
  "senha-alterada": "Senha alterada. Entre com a nova senha.",
  "link-expirado": "Esse link já foi usado ou venceu. Peça outro.",
};

export function EntrarForm({
  redirectTo,
  notice,
}: {
  redirectTo: string;
  notice: EntrarNotice;
}) {
  const [state, formAction, pending] = useActionState(signInPassword, INITIAL_SIGN_IN);
  const [linkState, linkAction, linkPending] = useActionState(requestMagicLink, INITIAL_LINK);
  const [, confirmAction, confirmPending] = useActionState(resendConfirmation, INITIAL_LINK);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // AUTH-05.6: o foco vai ao primeiro campo com erro.
  useEffect(() => {
    if (state.emailError) emailRef.current?.focus();
    else if (state.passwordError || state.error) passwordRef.current?.focus();
  }, [state]);

  const error = state.error ?? linkState.error;
  const email = state.email ?? "";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="rounded-xl border border-border bg-white">
        <AuthTabs current="entrar" />

        <div className="flex flex-col gap-6 p-6">
          <div>
            {/* as="h1" (semântica da página) com o estilo do variant "h2" (3xl). */}
            <Typography as="h1" variant="h2" color="primary">
              Entrar
            </Typography>
            <Typography variant="body" className="mt-2 text-foreground/70">
              Entre com seu e-mail e senha.
            </Typography>
          </div>

          {notice && (
            <Typography variant="body" role="status" className="rounded-lg bg-banner px-4 py-3">
              {NOTICE_TEXT[notice]}
            </Typography>
          )}

          <form action={formAction} className="flex flex-col gap-4" noValidate>
            <input type="hidden" name="redirect" value={redirectTo} />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="entrar-email" className="font-body text-sm font-medium">
                E-mail
              </label>
              <Input
                ref={emailRef}
                id="entrar-email"
                type="email"
                name="email"
                defaultValue={email}
                placeholder="seu@email.com"
                autoComplete="email"
                inputMode="email"
                autoFocus
                required
                aria-invalid={state.emailError ? true : undefined}
                aria-describedby={state.emailError ? "entrar-email-erro" : undefined}
                className="h-11 md:h-11"
              />
              {state.emailError && (
                <Typography id="entrar-email-erro" variant="body" size="sm" color="destructive">
                  {state.emailError}
                </Typography>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="entrar-senha" className="font-body text-sm font-medium">
                  Senha
                </label>
                <Link
                  href="/esqueci-senha"
                  className="min-h-11 content-center font-body text-sm text-primary underline-offset-4 hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
              <PasswordInput
                ref={passwordRef}
                id="entrar-senha"
                name="password"
                autoComplete="current-password"
                required
                aria-invalid={state.passwordError || state.error ? true : undefined}
                aria-describedby={state.passwordError ? "entrar-senha-erro" : undefined}
              />
              {state.passwordError && (
                <Typography id="entrar-senha-erro" variant="body" size="sm" color="destructive">
                  {state.passwordError}
                </Typography>
              )}
            </div>

            <div role="alert" aria-live="assertive">
              {error && (
                <Typography variant="body" color="destructive">
                  {error}
                </Typography>
              )}
            </div>

            <Button type="submit" size="lg" disabled={pending} className="h-11">
              {pending ? "Entrando…" : "Entrar"}
            </Button>

            <div className="flex items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-border" />
              <span className="font-body text-sm text-foreground/70">ou</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="submit"
              variant="outline"
              size="lg"
              formAction={linkAction}
              formNoValidate
              disabled={linkPending}
              className="h-11"
            >
              {linkPending ? "Enviando…" : "Receber link de acesso por e-mail"}
            </Button>
          </form>

          {state.unconfirmed && (
            <form action={confirmAction} className="flex flex-col gap-2">
              <input type="hidden" name="email" value={email} />
              <Button type="submit" variant="outline" size="lg" disabled={confirmPending} className="h-11">
                Reenviar e-mail de confirmação
              </Button>
            </form>
          )}

          <Typography variant="body" size="sm" className="text-foreground/70">
            Primeiro acesso depois da atualização? Use o link por e-mail ou redefina sua senha.
          </Typography>

          <Typography variant="body" size="sm">
            Não tem conta?{" "}
            <Link href="/cadastro" className="text-primary underline underline-offset-4">
              Criar conta
            </Link>
          </Typography>
        </div>
      </div>
    </main>
  );
}
