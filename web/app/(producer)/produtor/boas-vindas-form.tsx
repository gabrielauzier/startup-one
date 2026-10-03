"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { RadioCard } from "@/components/cadastro/RadioCard";
import { createBusiness, type CreateBusinessState } from "./actions";

export interface Partner {
  id: string;
  nome: string;
}

const INITIAL_STATE: CreateBusinessState = {};

/**
 * AUTH-17: as boas-vindas sao publicas. Visitante (ou quem nao e' produtor)
 * ve o convite para criar a conta de produtor; so' o produtor logado ve a
 * pergunta de indicacao (RN-11) e cria o negocio em rascunho.
 */
export function BoasVindasForm({
  partners,
  isProducer = true,
}: {
  partners: Partner[];
  isProducer?: boolean;
}) {
  if (!isProducer) {
    return (
      <Link
        href="/cadastro?perfil=produtor"
        className={cn(buttonVariants({ size: "lg" }), "h-11")}
      >
        Começar cadastro
      </Link>
    );
  }

  return <BoasVindasProducerForm partners={partners} />;
}

function BoasVindasProducerForm({ partners }: { partners: Partner[] }) {
  const [indicado, setIndicado] = useState<"sim" | "nao" | null>(null);
  const [parceiroId, setParceiroId] = useState("");
  const [state, formAction, pending] = useActionState(createBusiness, INITIAL_STATE);

  // CA-11.1: "Sim" sem parceiro escolhido destaca o campo "Qual?".
  const highlightParceiro = indicado === "sim" && !parceiroId && !!state.error;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="indicado" value={indicado ?? "nao"} />
      <input type="hidden" name="parceiroId" value={parceiroId} />

      <fieldset className="flex flex-col gap-2">
        <legend className="font-body text-sm font-medium text-foreground">
          Chegou até nós por uma cooperativa ou ONG?
        </legend>
        <div role="radiogroup" aria-label="Chegou até nós por uma cooperativa ou ONG?" className="flex gap-2">
          <RadioCard selected={indicado === "sim"} onSelect={() => setIndicado("sim")}>
            Sim
          </RadioCard>
          <RadioCard
            selected={indicado === "nao"}
            onSelect={() => {
              setIndicado("nao");
              setParceiroId("");
            }}
          >
            Não
          </RadioCard>
        </div>
      </fieldset>

      {indicado === "sim" && (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="parceiro-select"
            className={
              highlightParceiro
                ? "font-body text-sm font-medium text-destructive"
                : "font-body text-sm font-medium text-foreground"
            }
          >
            Qual?
          </label>
          <select
            id="parceiro-select"
            aria-label="Qual?"
            value={parceiroId}
            onChange={(e) => setParceiroId(e.target.value)}
            className={
              "rounded-md border bg-white px-3 py-2 font-body text-sm " +
              (highlightParceiro ? "border-destructive" : "border-border")
            }
          >
            <option value="">Selecione...</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          {highlightParceiro && (
            <p className="font-body text-sm text-destructive">
              Escolha qual cooperativa ou ONG indicou você.
            </p>
          )}
        </div>
      )}

      {state.error && !highlightParceiro && (
        <p className="font-body text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        Começar cadastro
      </Button>
    </form>
  );
}
