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
import { submitParte3, type Parte3State } from "./actions";

const INITIAL_STATE: Parte3State = {};

export interface Parte3Draft {
  produtos?: string[];
  producaoMensalKg?: number;
  praticas?: string[];
  impactos?: string[];
}

export function Parte3Form({ draft }: { draft: Parte3Draft }) {
  const [state, formAction, pending] = useActionState(submitParte3, INITIAL_STATE);
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

  return (
    <form action={formAction} className="flex flex-col gap-6">
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
              />
              {opt}
            </label>
          ))}
        </div>
        {state.field === "produtos" && (
          <p className="font-body text-sm text-destructive">{state.error}</p>
        )}
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
        />
        {state.field === "producaoMensalKg" && (
          <p className="font-body text-sm text-destructive">{state.error}</p>
        )}
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
              />
              {opt}
            </label>
          ))}
        </div>
        {state.field === "praticas" && (
          <p className="font-body text-sm text-destructive">{state.error}</p>
        )}
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
              />
              {opt}
            </label>
          ))}
        </div>
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
