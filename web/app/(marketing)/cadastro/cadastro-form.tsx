"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { AuthTabs } from "@/components/auth/AuthTabs";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { passwordRequirementMessage, validatePassword } from "@/lib/auth/password";
import { ROLE_OPTIONS } from "@/lib/auth/role-options";
import type { EntrarRole } from "@/lib/auth/redirect";
import { signUpAction, type SignUpState } from "./actions";

const INITIAL: SignUpState = {};

function FieldError({ id, children }: { id: string; children?: string }) {
  if (!children) return null;
  return (
    <Typography id={id} variant="body" size="sm" color="destructive">
      {children}
    </Typography>
  );
}

export function CadastroForm({ initialRole }: { initialRole: EntrarRole | null }) {
  const [state, formAction, pending] = useActionState(signUpAction, INITIAL);
  const [role, setRole] = useState<EntrarRole | null>(
    (state.values?.role as EntrarRole | undefined) ?? initialRole
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // AUTH-02.3/.4: validacao no cliente, antes de qualquer chamada ao servidor.
  const check = validatePassword(password);
  const clientPasswordError =
    password && !check.ok ? passwordRequirementMessage(check.missing) : undefined;
  const clientConfirmError =
    confirm && confirm !== password ? "As senhas não são iguais." : undefined;
  const blocked = !check.ok || confirm !== password;

  const passwordError = clientPasswordError ?? state.passwordError;
  const confirmError = clientConfirmError ?? state.confirmError;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="rounded-xl border border-border bg-white">
        <AuthTabs current="cadastro" />

        <div className="flex flex-col gap-6 p-6">
          <div>
            <Typography as="h1" variant="h2" color="primary">
              Criar conta
            </Typography>
            <Typography variant="body" className="mt-2 text-foreground/70">
              Escolha como você usa a Îasy e crie sua senha.
            </Typography>
          </div>

          <form
            action={formAction}
            onSubmit={(e) => {
              if (blocked) e.preventDefault();
            }}
            className="flex flex-col gap-4"
            noValidate
          >
            <input type="hidden" name="role" value={role ?? ""} />

            <div
              role="radiogroup"
              aria-label="Como você usa a Îasy?"
              className="flex flex-col gap-2"
            >
              {ROLE_OPTIONS.map((r) => (
                <Button
                  key={r.value}
                  type="button"
                  variant={role === r.value ? "default" : "outline"}
                  role="radio"
                  aria-checked={role === r.value}
                  onClick={() => setRole(r.value)}
                  className="h-11"
                >
                  {r.label}
                </Button>
              ))}
            </div>
            <FieldError id="cadastro-role-erro">{state.roleError}</FieldError>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cadastro-nome" className="font-body text-sm font-medium">
                Nome
              </label>
              <Input
                id="cadastro-nome"
                name="nome"
                defaultValue={state.values?.nome ?? ""}
                autoComplete="name"
                required
                aria-invalid={state.nomeError ? true : undefined}
                aria-describedby={state.nomeError ? "cadastro-nome-erro" : undefined}
                className="h-11 md:h-11"
              />
              <FieldError id="cadastro-nome-erro">{state.nomeError}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cadastro-email" className="font-body text-sm font-medium">
                E-mail
              </label>
              <Input
                id="cadastro-email"
                type="email"
                name="email"
                defaultValue={state.values?.email ?? ""}
                placeholder="seu@email.com"
                autoComplete="email"
                inputMode="email"
                required
                aria-invalid={state.emailError ? true : undefined}
                aria-describedby={state.emailError ? "cadastro-email-erro" : undefined}
                className="h-11 md:h-11"
              />
              <FieldError id="cadastro-email-erro">{state.emailError}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cadastro-senha" className="font-body text-sm font-medium">
                Senha
              </label>
              <PasswordInput
                id="cadastro-senha"
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={passwordError ? true : undefined}
                aria-describedby="cadastro-senha-ajuda"
              />
              <Typography id="cadastro-senha-ajuda" variant="body" size="xs" className="text-foreground/70">
                Mínimo 8 caracteres, com ao menos 1 letra e 1 número.
              </Typography>
              <FieldError id="cadastro-senha-erro">{passwordError}</FieldError>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cadastro-confirmar" className="font-body text-sm font-medium">
                Confirmar senha
              </label>
              <PasswordInput
                id="cadastro-confirmar"
                name="confirm"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={confirmError ? true : undefined}
                aria-describedby={confirmError ? "cadastro-confirmar-erro" : undefined}
              />
              <FieldError id="cadastro-confirmar-erro">{confirmError}</FieldError>
            </div>

            <div role="alert" aria-live="assertive">
              {state.error && (
                <Typography variant="body" color="destructive">
                  {state.error}
                </Typography>
              )}
            </div>

            <Button type="submit" size="lg" disabled={pending || !role || blocked} className="h-11">
              {pending ? "Criando…" : "Criar conta"}
            </Button>
          </form>

          <Typography variant="body" size="sm">
            Já tem conta?{" "}
            <Link href="/entrar" className="text-primary underline underline-offset-4">
              Entrar
            </Link>
          </Typography>
        </div>
      </div>
    </main>
  );
}
