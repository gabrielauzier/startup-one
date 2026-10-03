"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { passwordRequirementMessage, validatePassword } from "@/lib/auth/password";
import { setNewPassword, type SetPasswordState } from "./actions";

const INITIAL: SetPasswordState = {};

export function RedefinirSenhaForm() {
  const [state, formAction, pending] = useActionState(setNewPassword, INITIAL);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const check = validatePassword(password);
  const passwordError =
    (password && !check.ok ? passwordRequirementMessage(check.missing) : undefined) ??
    state.passwordError;
  const confirmError =
    (confirm && confirm !== password ? "As senhas não são iguais." : undefined) ??
    state.confirmError;
  const blocked = !check.ok || confirm !== password;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <Typography as="h1" variant="h2" color="primary">
          Criar nova senha
        </Typography>
        <Typography variant="body" className="mt-2 text-foreground/70">
          Escolha uma senha nova para a sua conta.
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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nova-senha" className="font-body text-sm font-medium">
            Nova senha
          </label>
          <PasswordInput
            id="nova-senha"
            name="password"
            autoComplete="new-password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={passwordError ? true : undefined}
            aria-describedby="nova-senha-ajuda"
          />
          <Typography id="nova-senha-ajuda" variant="body" size="xs" className="text-foreground/60">
            Mínimo 8 caracteres, com ao menos 1 letra e 1 número.
          </Typography>
          {passwordError && (
            <Typography variant="body" size="sm" color="destructive">
              {passwordError}
            </Typography>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nova-senha-confirmar" className="font-body text-sm font-medium">
            Confirmar nova senha
          </label>
          <PasswordInput
            id="nova-senha-confirmar"
            name="confirm"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={confirmError ? true : undefined}
          />
          {confirmError && (
            <Typography variant="body" size="sm" color="destructive">
              {confirmError}
            </Typography>
          )}
        </div>

        <div role="alert" aria-live="assertive">
          {state.error && (
            <Typography variant="body" color="destructive">
              {state.error}
            </Typography>
          )}
        </div>

        <Button type="submit" size="lg" disabled={pending || blocked} className="h-11">
          {pending ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </form>
    </main>
  );
}
