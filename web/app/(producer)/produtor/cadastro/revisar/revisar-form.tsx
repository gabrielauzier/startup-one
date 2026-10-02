"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConnectionFooter } from "@/components/shared/ConnectionFooter";
import { submitBusiness, type SubmitBusinessState } from "../actions";
import type { DraftData } from "@/lib/business/draft";

const INITIAL_STATE: SubmitBusinessState = {};

export interface EvidenceCounts {
  onde_produz: number;
  produto: number;
  terra: number;
  selo: number;
}

function formatBRL(value?: number): string {
  if (value === undefined || value === null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function RevisarForm({
  businessId,
  draft,
  evidenceCounts,
}: {
  businessId: string;
  draft: DraftData;
  evidenceCounts: EvidenceCounts;
}) {
  const submitWithId = submitBusiness.bind(null, businessId);
  const [state, formAction, pending] = useActionState(submitWithId, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <section className="flex flex-col gap-2 rounded-md border border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-primary">Sobre você</h2>
          <Link href="/produtor/cadastro/1" className="font-body text-sm text-primary underline">
            Editar
          </Link>
        </div>
        <p className="font-body text-sm text-foreground/80">{draft.part1.nome as string}</p>
        <p className="font-body text-sm text-foreground/80">{draft.part1.telefone as string}</p>
        <p className="font-body text-sm text-foreground/80">{draft.part1.cnpj as string}</p>
      </section>

      <section className="flex flex-col gap-2 rounded-md border border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-primary">Seu negócio</h2>
          <Link href="/produtor/cadastro/2" className="font-body text-sm text-primary underline">
            Editar
          </Link>
        </div>
        <p className="font-body text-sm text-foreground/80">{draft.part2.nome as string}</p>
        <p className="font-body text-sm text-foreground/80">
          {draft.part2.cidade as string} — {draft.part2.uf as string}
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-md border border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-primary">Sua produção</h2>
          <Link href="/produtor/cadastro/3" className="font-body text-sm text-primary underline">
            Editar
          </Link>
        </div>
        <p className="font-body text-sm text-foreground/80">
          {((draft.part3.produtos as string[] | undefined) ?? []).join(", ")}
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-md border border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-primary">Fotos e documentos</h2>
          <Link href="/produtor/cadastro/4" className="font-body text-sm text-primary underline">
            Editar
          </Link>
        </div>
        <p className="font-body text-sm text-foreground/80">
          Onde produzem: {evidenceCounts.onde_produz} · Produto: {evidenceCounts.produto} ·
          Terra: {evidenceCounts.terra} · Selos: {evidenceCounts.selo}
        </p>
      </section>

      <section className="flex flex-col gap-2 rounded-md border border-border p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-primary">Quanto vocês precisam</h2>
          <Link href="/produtor/cadastro/5" className="font-body text-sm text-primary underline">
            Editar
          </Link>
        </div>
        <p className="font-body text-sm text-foreground/80">
          {formatBRL(draft.part5.valorBusca as number | undefined)}
        </p>
        <p className="font-body text-sm text-foreground/80">
          Retorno proposto {String(draft.part5.retornoProposto ?? "—")}% ao ano
        </p>
      </section>

      {state.error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4">
          <p className="font-body text-sm text-destructive">{state.error}</p>
          {state.missing && state.missing.length > 0 && (
            <ul className="mt-2 list-disc pl-5 font-body text-sm text-destructive">
              {state.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Button type="submit" disabled={pending}>
        Enviar para análise
      </Button>

      <ConnectionFooter />
    </form>
  );
}
