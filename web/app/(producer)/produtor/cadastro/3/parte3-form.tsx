"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  IMPACT_OPTIONS,
  PRACTICE_OPTIONS,
  PRODUTOS_OPTIONS,
} from "@/lib/business/impact-options";
import { PartHeader } from "@/components/cadastro/PartHeader";
import {
  AjusteComment,
  LockedHiddenValues,
  isFieldLocked,
} from "@/components/cadastro/AjusteFieldNote";
import { useDraftSync } from "@/lib/offline/use-draft-sync";
import type { FieldAjusteInfo } from "@/lib/business/adjustable-fields";
import { submitParte3, type Parte3State } from "./actions";

const INITIAL_STATE: Parte3State = {};

export interface Parte3Draft {
  produtos?: string[];
  producaoMensalKg?: number;
  praticas?: string[];
  impactos?: string[];
}

export function Parte3Form({
  businessId,
  draft,
  ajuste = null,
}: {
  businessId: string;
  draft: Parte3Draft;
  ajuste?: FieldAjusteInfo | null;
}) {
  const [state, formAction, pending] = useActionState(submitParte3, INITIAL_STATE);
  const { status, saveDraft } = useDraftSync(businessId, 3);
  const producaoRef = useRef<HTMLInputElement>(null);

  // Controlado no cliente: os Server Actions do React resetam inputs
  // nao-controlados apos qualquer submissao (sucesso ou erro) - sem
  // isso, um erro num campo apagaria os outros ja preenchidos.
  const [produtos, setProdutos] = useState<Set<string>>(
    () => new Set(draft.produtos ?? [])
  );
  const [praticas, setPraticas] = useState<Set<string>>(
    () => new Set(draft.praticas ?? [])
  );
  const [impactos, setImpactos] = useState<Set<string>>(
    () => new Set(draft.impactos ?? [])
  );
  const [producaoMensalKg, setProducaoMensalKg] = useState(
    () => draft.producaoMensalKg?.toString() ?? ""
  );

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, opt: string) {
    const next = new Set(set);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    setter(next);
  }

  useEffect(() => {
    if (state.field === "producaoMensalKg") {
      producaoRef.current?.focus();
    }
  }, [state.field, state.error]);

  // CA-07.1: salva cada mudanca relevante no aparelho (debounced) - e' a
  // parte usada no teste de queda de conexao (context.setOffline).
  useEffect(() => {
    const timer = setTimeout(() => {
      void saveDraft({
        produtos: Array.from(produtos),
        producaoMensalKg: producaoMensalKg ? Number(producaoMensalKg) : undefined,
        praticas: Array.from(praticas),
        impactos: Array.from(impactos),
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [produtos, producaoMensalKg, praticas, impactos, saveDraft]);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <PartHeader part={3} title="Sua produção" status={status} />
      <fieldset className="flex flex-col gap-2">
        <legend className="font-body text-sm font-medium">Produtos</legend>
        <div className="flex flex-col gap-2">
          {PRODUTOS_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 font-body text-sm">
              <Checkbox
                name="produtos"
                value={opt}
                checked={produtos.has(opt)}
                onCheckedChange={() => toggle(produtos, setProdutos, opt)}
                disabled={isFieldLocked(ajuste, "produtos")}
              />
              {opt}
            </label>
          ))}
        </div>
        <LockedHiddenValues
          ajuste={ajuste}
          campo="produtos"
          name="produtos"
          values={Array.from(produtos)}
        />
        {state.field === "produtos" && (
          <p className="font-body text-sm text-destructive">{state.error}</p>
        )}
        <AjusteComment ajuste={ajuste} campo="produtos" />
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="producaoMensalKg" className="font-body text-sm font-medium">
          Produção mensal aproximada (kg)
        </label>
        <Input
          id="producaoMensalKg"
          name="producaoMensalKg"
          type="number"
          step="any"
          ref={producaoRef}
          value={producaoMensalKg}
          onChange={(e) => setProducaoMensalKg(e.target.value)}
          required
          readOnly={isFieldLocked(ajuste, "producaoMensalKg")}
        />
        {state.field === "producaoMensalKg" && (
          <p className="font-body text-sm text-destructive">{state.error}</p>
        )}
        <AjusteComment ajuste={ajuste} campo="producaoMensalKg" />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-body text-sm font-medium">
          Como cuidam da floresta (marque apenas o que praticam)
        </legend>
        <div className="flex flex-col gap-2">
          {PRACTICE_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 font-body text-sm">
              <Checkbox
                name="praticas"
                value={opt}
                checked={praticas.has(opt)}
                onCheckedChange={() => toggle(praticas, setPraticas, opt)}
                disabled={isFieldLocked(ajuste, "praticas")}
              />
              {opt}
            </label>
          ))}
        </div>
        <LockedHiddenValues
          ajuste={ajuste}
          campo="praticas"
          name="praticas"
          values={Array.from(praticas)}
        />
        {state.field === "praticas" && (
          <p className="font-body text-sm text-destructive">{state.error}</p>
        )}
        <AjusteComment ajuste={ajuste} campo="praticas" />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="font-body text-sm font-medium">
          Impactos gerados (opcional)
        </legend>
        <div className="flex flex-col gap-2">
          {IMPACT_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-2 font-body text-sm">
              <Checkbox
                name="impactos"
                value={opt}
                checked={impactos.has(opt)}
                onCheckedChange={() => toggle(impactos, setImpactos, opt)}
                disabled={isFieldLocked(ajuste, "impactos")}
              />
              {opt}
            </label>
          ))}
        </div>
        <LockedHiddenValues
          ajuste={ajuste}
          campo="impactos"
          name="impactos"
          values={Array.from(impactos)}
        />
        <AjusteComment ajuste={ajuste} campo="impactos" />
      </fieldset>

      {state.error && !state.field && (
        <p className="font-body text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex items-center justify-between">
        <Link href="/produtor/cadastro/2" className="font-body text-sm text-foreground/70">
          Voltar
        </Link>
        <Button type="submit" disabled={pending}>
          Continuar
        </Button>
      </div>
    </form>
  );
}
