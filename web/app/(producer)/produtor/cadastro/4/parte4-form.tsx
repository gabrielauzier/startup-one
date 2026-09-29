"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PhotoUploader } from "@/components/upload/PhotoUploader";
import { PartHeader } from "@/components/cadastro/PartHeader";
import { useDraftSync } from "@/lib/offline/use-draft-sync";
import { submitParte4, type Parte4State } from "./actions";

const INITIAL_STATE: Parte4State = {};

export interface Parte4Counts {
  onde_produz: number;
  produto: number;
  terra: number;
  selo: number;
}

export function Parte4Form({
  businessId,
  counts,
}: {
  businessId: string;
  counts: Parte4Counts;
}) {
  const [state, formAction, pending] = useActionState(submitParte4, INITIAL_STATE);
  const { status } = useDraftSync(businessId, 4);
  const [ondeProduzCount, setOndeProduzCount] = useState(counts.onde_produz);
  const [produtoCount, setProdutoCount] = useState(counts.produto);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <PartHeader part={4} title="Fotos e documentos" status={status} />
      <PhotoUploader
        businessId={businessId}
        grupo="onde_produz"
        label="Fotos de onde vocês produzem"
        required
        highlight={state.field === "onde_produz"}
        initialCount={counts.onde_produz}
        onUploaded={() => setOndeProduzCount((c) => c + 1)}
      />

      <PhotoUploader
        businessId={businessId}
        grupo="produto"
        label="Fotos do produto ou da colheita"
        required
        highlight={state.field === "produto"}
        initialCount={counts.produto}
        onUploaded={() => setProdutoCount((c) => c + 1)}
      />

      <PhotoUploader
        businessId={businessId}
        grupo="terra"
        label="Documento da terra (CAR ou DAP) — pode enviar depois"
        initialCount={counts.terra}
      />

      <PhotoUploader
        businessId={businessId}
        grupo="selo"
        label="Selos de certificadoras que já têm"
        initialCount={counts.selo}
      />

      {/* Campos escondidos so' para o React nao reclamar de inputs nao
          controlados fora do PhotoUploader; a contagem real vem do banco
          (listEvidences), lida de novo no submitParte4 no servidor. */}
      <input type="hidden" name="ondeProduzCount" value={ondeProduzCount} readOnly />
      <input type="hidden" name="produtoCount" value={produtoCount} readOnly />

      {state.error && (
        <p className="font-body text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex items-center justify-between">
        <Link href="/produtor/cadastro/3" className="font-body text-sm text-foreground/70">
          Voltar
        </Link>
        <Button type="submit" disabled={pending}>
          Continuar
        </Button>
      </div>
    </form>
  );
}
