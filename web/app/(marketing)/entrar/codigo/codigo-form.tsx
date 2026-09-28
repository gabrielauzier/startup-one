"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  sendOtp,
  verifyOtp,
  type SendOtpState,
  type VerifyOtpState,
} from "../actions";

const INITIAL_VERIFY_STATE: VerifyOtpState = { attempts: 0 };
const INITIAL_SEND_STATE: SendOtpState = {};
const MAX_ATTEMPTS = 5;

export function CodigoForm({
  email,
  role,
  redirectTo,
}: {
  email: string;
  role: string;
  redirectTo: string;
}) {
  const [state, formAction, pending] = useActionState(
    verifyOtp,
    INITIAL_VERIFY_STATE
  );
  const [resendState, resendAction] = useActionState(
    sendOtp,
    INITIAL_SEND_STATE
  );
  const blocked = state.attempts >= MAX_ATTEMPTS;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-24">
      <div>
        <h1 className="font-heading text-3xl text-primary">Código de acesso</h1>
        <p className="mt-2 font-body text-sm text-foreground/70">
          Enviamos um código de 6 dígitos para {email}.
        </p>
      </div>

      <form
        action={formAction}
        data-attempts={state.attempts}
        className="flex flex-col gap-4"
      >
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="redirect" value={redirectTo} />

        <Input
          type="text"
          name="code"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          aria-label="Código de 6 dígitos"
          disabled={blocked}
          required
        />

        {state.error && (
          <p className="font-body text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" disabled={pending || blocked}>
          Confirmar
        </Button>
      </form>

      <form action={resendAction} className="flex flex-col gap-2">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="redirect" value={redirectTo} />
        {resendState.error && (
          <p className="font-body text-sm text-destructive">
            {resendState.error}
          </p>
        )}
        <Button type="submit" variant="outline">
          Reenviar código
        </Button>
      </form>
    </main>
  );
}
