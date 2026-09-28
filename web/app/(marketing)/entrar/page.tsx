"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendOtp, type EntrarRole, type SendOtpState } from "./actions";

const ROLES: { value: EntrarRole; label: string }[] = [
  { value: "investidor", label: "Quero investir" },
  { value: "empresa", label: "Represento uma empresa" },
  { value: "produtor", label: "Produzo na Amazônia" },
];

const INITIAL_STATE: SendOtpState = {};

export default function EntrarPage() {
  const [role, setRole] = useState<EntrarRole | null>(null);
  const [state, formAction, pending] = useActionState(sendOtp, INITIAL_STATE);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-24">
      <div>
        <h1 className="font-heading text-3xl text-primary">Entrar</h1>
        <p className="mt-2 font-body text-sm text-foreground/70">
          Sem senha: enviamos um código de acesso.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="role" value={role ?? ""} />

        <div
          role="radiogroup"
          aria-label="Como você usa a Îasy?"
          className="flex flex-col gap-2"
        >
          {ROLES.map((r) => (
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

        <Input
          type="email"
          name="email"
          placeholder="seu@email.com"
          required
          aria-label="E-mail"
        />

        {state.error && (
          <p className="font-body text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" disabled={!role || pending}>
          Entrar
        </Button>
      </form>
    </main>
  );
}
