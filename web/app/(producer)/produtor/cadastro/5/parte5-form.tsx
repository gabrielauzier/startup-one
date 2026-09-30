"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConnectionFooter } from "@/components/shared/ConnectionFooter";
import { PartHeader } from "@/components/cadastro/PartHeader";
import {
  AjusteComment,
  LockedHiddenValue,
  isFieldLocked,
} from "@/components/cadastro/AjusteFieldNote";
import { useDraftSync } from "@/lib/offline/use-draft-sync";
import type { FieldAjusteInfo } from "@/lib/business/adjustable-fields";
import { submitParte5, type Parte5State } from "./actions";
import { VALOR_MAX, VALOR_MIN, VALOR_STEP } from "./constants";

const INITIAL_STATE: Parte5State = {};

const FINALIDADES = [
  { value: "obras", label: "Obras e estrutura" },
  { value: "equipamentos", label: "Equipamentos" },
  { value: "area", label: "Aumentar a área" },
  { value: "contas", label: "Contas do dia a dia" },
];

const PRAZOS = [12, 18, 24, 36];

export interface Parte5Draft {
  finalidade?: string;
  valorBusca?: number;
  prazoMeses?: number;
  retornoProposto?: number;
}

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function Parte5Form({
  businessId,
  draft,
  ajuste = null,
}: {
  businessId: string;
  draft: Parte5Draft;
  ajuste?: FieldAjusteInfo | null;
}) {
  const [state, formAction, pending] = useActionState(submitParte5, INITIAL_STATE);
  const { status, saveDraft } = useDraftSync(businessId, 5);

  const [finalidade, setFinalidade] = useState(() => draft.finalidade ?? "");
  const [valorBusca, setValorBusca] = useState(() => draft.valorBusca ?? VALOR_MIN);
  const [prazoMeses, setPrazoMeses] = useState(() => draft.prazoMeses ?? 12);
  const [retornoProposto, setRetornoProposto] = useState(
    () => draft.retornoProposto?.toString().replace(".", ",") ?? ""
  );
  const [showRetornoInfo, setShowRetornoInfo] = useState(false);

  const retornoNumero = Number(retornoProposto.replace(",", "."));
  const previewRetorno =
    retornoProposto !== "" && Number.isFinite(retornoNumero)
      ? `Retorno proposto ${retornoProposto}% ao ano`
      : null;

  // CA-07.1: salva cada mudanca relevante no aparelho (debounced).
  useEffect(() => {
    const timer = setTimeout(() => {
      void saveDraft({
        finalidade,
        valorBusca,
        prazoMeses,
        retornoProposto: retornoNumero,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [finalidade, valorBusca, prazoMeses, retornoNumero, saveDraft]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <PartHeader part={5} title="Quanto vocês precisam" status={status} />
      <div className="flex flex-col gap-1">
        <label htmlFor="finalidade" className="font-body text-sm font-medium">
          Finalidade
        </label>
        <select
          id="finalidade"
          name="finalidade"
          value={finalidade}
          onChange={(e) => setFinalidade(e.target.value)}
          disabled={isFieldLocked(ajuste, "finalidade")}
          className="rounded-md border border-border bg-white px-3 py-2 font-body text-sm disabled:opacity-50"
        >
          <option value="">Selecione...</option>
          {FINALIDADES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <LockedHiddenValue
          ajuste={ajuste}
          campo="finalidade"
          name="finalidade"
          value={finalidade}
        />
        {state.field === "finalidade" && (
          <p className="font-body text-sm text-destructive">{state.error}</p>
        )}
        <AjusteComment ajuste={ajuste} campo="finalidade" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="valorBusca" className="font-body text-sm font-medium">
          Valor — {formatBRL(valorBusca)}
        </label>
        <input
          id="valorBusca"
          name="valorBusca"
          type="range"
          min={VALOR_MIN}
          max={VALOR_MAX}
          step={VALOR_STEP}
          value={valorBusca}
          onChange={(e) => setValorBusca(Number(e.target.value))}
          aria-label="Valor"
          disabled={isFieldLocked(ajuste, "valorBusca")}
        />
        <p className="font-body text-xs text-foreground/60">
          De {formatBRL(VALOR_MIN)} a {formatBRL(VALOR_MAX)}, em passos de{" "}
          {formatBRL(VALOR_STEP)}
        </p>
        <LockedHiddenValue
          ajuste={ajuste}
          campo="valorBusca"
          name="valorBusca"
          value={String(valorBusca)}
        />
        {state.field === "valorBusca" && (
          <p className="font-body text-sm text-destructive">{state.error}</p>
        )}
        <AjusteComment ajuste={ajuste} campo="valorBusca" />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-body text-sm font-medium">
          Prazo para devolver (meses)
        </legend>
        <div role="radiogroup" aria-label="Prazo para devolver (meses)" className="flex gap-2">
          {PRAZOS.map((p) => (
            <Button
              key={p}
              type="button"
              variant={prazoMeses === p ? "default" : "outline"}
              role="radio"
              aria-checked={prazoMeses === p}
              onClick={() => setPrazoMeses(p)}
              disabled={isFieldLocked(ajuste, "prazoMeses")}
            >
              {p}
            </Button>
          ))}
        </div>
        <input type="hidden" name="prazoMeses" value={prazoMeses} readOnly />
        {state.field === "prazoMeses" && (
          <p className="font-body text-sm text-destructive">{state.error}</p>
        )}
        <AjusteComment ajuste={ajuste} campo="prazoMeses" />
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="retornoProposto" className="font-body text-sm font-medium">
          Retorno ao ano (%)
        </label>
        <Input
          id="retornoProposto"
          name="retornoProposto"
          inputMode="decimal"
          placeholder="Ex.: 14,8"
          value={retornoProposto}
          onChange={(e) => setRetornoProposto(e.target.value)}
          required
          readOnly={isFieldLocked(ajuste, "retornoProposto")}
        />
        <button
          type="button"
          onClick={() => setShowRetornoInfo((v) => !v)}
          className="w-fit font-body text-sm text-primary underline"
        >
          O que é o retorno?
        </button>
        {showRetornoInfo && (
          <p className="font-body text-sm text-foreground/70">
            É uma proposta: o valor final é definido com o parceiro financeiro.
          </p>
        )}
        {previewRetorno && (
          <p className="font-body text-sm text-foreground/80">{previewRetorno}</p>
        )}
        {state.field === "retornoProposto" && (
          <p className="font-body text-sm text-destructive">{state.error}</p>
        )}
        <AjusteComment ajuste={ajuste} campo="retornoProposto" />
      </div>

      {state.error && !state.field && (
        <p className="font-body text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex items-center justify-between">
        <Link href="/produtor/cadastro/4" className="font-body text-sm text-foreground/70">
          Voltar
        </Link>
        <Button type="submit" disabled={pending}>
          Continuar
        </Button>
      </div>

      <ConnectionFooter />
    </form>
  );
}
