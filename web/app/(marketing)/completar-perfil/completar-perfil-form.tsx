"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { ROLE_OPTIONS } from "@/lib/auth/role-options";
import type { EntrarRole } from "@/lib/auth/redirect";
import { completeProfile, type CompleteProfileState } from "./actions";

const INITIAL_STATE: CompleteProfileState = {};

export function CompletarPerfilForm({ redirectTo }: { redirectTo: string }) {
  const [role, setRole] = useState<EntrarRole | null>(null);
  const [state, formAction, pending] = useActionState(completeProfile, INITIAL_STATE);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-24">
      <div>
        <Typography as="h1" variant="h2" color="primary">
          Complete seu perfil
        </Typography>
        <Typography variant="body" className="mt-2 text-foreground/70">
          Falta só dizer como você usa a Îasy.
        </Typography>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="role" value={role ?? ""} />
        <input type="hidden" name="redirect" value={redirectTo} />

        <div role="radiogroup" aria-label="Como você usa a Îasy?" className="flex flex-col gap-2">
          {ROLE_OPTIONS.map((r) => (
            <Button
              key={r.value}
              type="button"
              variant={role === r.value ? "default" : "outline"}
              role="radio"
              aria-checked={role === r.value}
              onClick={() => setRole(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
        {state.roleError && (
          <Typography variant="body" color="destructive" role="alert">
            {state.roleError}
          </Typography>
        )}

        <Input
          type="text"
          name="nome"
          autoComplete="name"
          placeholder="Seu nome"
          aria-label="Nome"
          aria-invalid={state.nomeError ? true : undefined}
          required
        />
        {state.nomeError && (
          <Typography variant="body" color="destructive" role="alert">
            {state.nomeError}
          </Typography>
        )}

        {state.error && (
          <Typography variant="body" color="destructive" role="alert">
            {state.error}
          </Typography>
        )}

        <Button type="submit" disabled={pending}>
          Continuar
        </Button>
      </form>
    </main>
  );
}
