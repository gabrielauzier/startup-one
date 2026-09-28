"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { isValidMotivo } from "@/lib/verification/checklist";
import { suspend, reactivate } from "./actions";

/**
 * RF-16/RN-21: suspende (com motivo, 20+ caracteres) ou reativa um
 * negócio já Verificado/Suspenso.
 */
export function SuspensaoPanel({
  businessId,
  status,
}: {
  businessId: string;
  status: string;
}) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (status !== "verificado" && status !== "suspenso") {
    return null;
  }

  if (status === "suspenso") {
    return (
      <section className="rounded-md border border-border p-4">
        <h2 className="font-heading text-lg text-primary">Selo suspenso</h2>
        <Button
          type="button"
          disabled={pending}
          data-testid="botao-reativar"
          onClick={() =>
            startTransition(async () => {
              const result = await reactivate(businessId);
              if (!result.ok) {
                setError(result.error ?? "Erro ao reativar.");
                return;
              }
              router.refresh();
            })
          }
        >
          Reativar
        </Button>
        {error && <p className="font-body text-sm text-destructive">{error}</p>}
      </section>
    );
  }

  return (
    <section className="rounded-md border border-border p-4">
      <h2 className="font-heading text-lg text-primary">Suspender selo</h2>
      <div className="mt-2 flex flex-col gap-2">
        <label htmlFor="motivo-suspensao" className="font-body text-sm font-medium">
          Motivo (mínimo 20 caracteres)
        </label>
        <textarea
          id="motivo-suspensao"
          data-testid="motivo-suspensao"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          rows={3}
          className="rounded-md border border-border bg-background px-3 py-2 font-body text-sm"
        />
        <Button
          type="button"
          variant="destructive"
          disabled={!isValidMotivo(motivo) || pending}
          data-testid="confirmar-suspensao"
          onClick={() =>
            startTransition(async () => {
              const result = await suspend(businessId, motivo);
              if (!result.ok) {
                setError(result.error ?? "Erro ao suspender.");
                return;
              }
              router.refresh();
            })
          }
        >
          Suspender
        </Button>
        {error && <p className="font-body text-sm text-destructive">{error}</p>}
      </div>
    </section>
  );
}
