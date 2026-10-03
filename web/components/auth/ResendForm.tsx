"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

export interface ResendState {
  error?: string;
  sent?: boolean;
  retryAfterSec?: number;
}

type Tracked = ResendState & { at?: number };

const INITIAL: Tracked = {};

/**
 * Botao de reenvio com cooldown visivel (AUTH-09): comeca bloqueado por
 * `initialCooldown` s (o e-mail acabou de sair), desbloqueia ao zerar e
 * reinicia com o `retryAfterSec` que a action devolver.
 */
export function ResendForm({
  action,
  label,
  sentText,
  initialCooldown = 60,
}: {
  action: (prev: ResendState, formData: FormData) => Promise<ResendState>;
  label: string;
  sentText: string;
  initialCooldown?: number;
}) {
  // O cooldown e' derivado de um instante-limite: o da montagem (e-mail que
  // acabou de sair) ou o do ultimo retorno da action (`retryAfterSec`).
  const [mountedAt] = useState(() => Date.now());
  const [now, setNow] = useState(mountedAt);
  const [state, formAction, pending] = useActionState(
    async (prev: ResendState, formData: FormData): Promise<Tracked> => ({
      ...(await action(prev, formData)),
      at: Date.now(),
    }),
    INITIAL
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const startedAt = state.at ?? mountedAt;
  const duration = state.at ? (state.retryAfterSec ?? 0) : initialCooldown;
  const elapsed = Math.max(0, now - startedAt);
  const remaining = Math.max(0, Math.ceil(duration - elapsed / 1000));
  const waiting = remaining > 0;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <div role="status" aria-live="polite">
        {state.sent && !state.error && (
          <Typography variant="body" size="sm">
            {sentText}
          </Typography>
        )}
      </div>
      <div role="alert">
        {state.error && (
          <Typography variant="body" size="sm" color="destructive">
            {state.error}
          </Typography>
        )}
      </div>
      <Button type="submit" variant="outline" size="lg" disabled={pending || waiting} className="h-11">
        {waiting ? `${label} (${remaining} s)` : label}
      </Button>
    </form>
  );
}
