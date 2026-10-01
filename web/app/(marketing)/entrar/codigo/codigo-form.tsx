"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
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
        {/* as="h1" (semântica da página) com o estilo do variant "h2" (3xl). */}
        <Typography as="h1" variant="h2" color="primary">
          Código de acesso
        </Typography>
        <Typography variant="body" className="mt-2 text-foreground/70">
          Enviamos um código de 6 dígitos para {email}.
        </Typography>
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
          <Typography variant="body" color="destructive">
            {state.error}
          </Typography>
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
          <Typography variant="body" color="destructive">
            {resendState.error}
          </Typography>
        )}
        <Button type="submit" variant="outline">
          Reenviar código
        </Button>
      </form>
    </main>
  );
}
