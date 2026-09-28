"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { submitParte2, type Parte2State } from "./actions";

const INITIAL_STATE: Parte2State = {};

const TIPOS_ORG = [
  { value: "cooperativa", label: "Cooperativa" },
  { value: "associacao", label: "Associação" },
  { value: "pequena_empresa", label: "Pequena empresa" },
];

export interface Parte2Draft {
  nome?: string;
  tipoOrg?: string;
  cidade?: string;
  uf?: string;
  familias?: number;
  anosAtividade?: number;
  recebeVisitas?: boolean;
}

export function Parte2Form({ draft }: { draft: Parte2Draft }) {
  const [state, formAction, pending] = useActionState(submitParte2, INITIAL_STATE);

  const nomeRef = useRef<HTMLInputElement>(null);
  const cidadeRef = useRef<HTMLInputElement>(null);
  const ufRef = useRef<HTMLInputElement>(null);
  const familiasRef = useRef<HTMLInputElement>(null);
  const anosRef = useRef<HTMLInputElement>(null);

  // Controlado no cliente pelo mesmo motivo do Parte1Form: React reseta
  // inputs nao-controlados apos qualquer Server Action, mesmo em erro.
  const [nome, setNome] = useState(() => draft.nome ?? "");
  const [tipoOrg, setTipoOrg] = useState(() => draft.tipoOrg ?? "");
  const [cidade, setCidade] = useState(() => draft.cidade ?? "");
  const [uf, setUf] = useState(() => draft.uf ?? "");
  const [familias, setFamilias] = useState(() => draft.familias?.toString() ?? "");
  const [anosAtividade, setAnosAtividade] = useState(
    () => draft.anosAtividade?.toString() ?? ""
  );
  const [recebeVisitas, setRecebeVisitas] = useState(() => draft.recebeVisitas ?? false);

  useEffect(() => {
    if (!state.field) return;
    const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {
      nome: nomeRef,
      cidade: cidadeRef,
      uf: ufRef,
      familias: familiasRef,
      anosAtividade: anosRef,
    };
    refs[state.field]?.current?.focus();
  }, [state.field, state.error]);

  if (state.outOfScope) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-body text-sm text-foreground/80">
          Por enquanto, o piloto da Îasy atende só negócios na Amazônia Legal.
          Já guardamos seu contato e avisaremos quando chegarmos até você.
        </p>
        <Link href="/produtor" className="font-body text-sm text-primary underline">
          Voltar para as boas-vindas
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className="font-body text-sm font-medium">
          Nome do negócio
        </label>
        <Input
          id="nome"
          name="nome"
          ref={nomeRef}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tipoOrg" className="font-body text-sm font-medium">
          Tipo de organização
        </label>
        <select
          id="tipoOrg"
          name="tipoOrg"
          value={tipoOrg}
          onChange={(e) => setTipoOrg(e.target.value)}
          aria-label="Tipo de organização"
          className="rounded-md border border-border bg-background px-3 py-2 font-body text-sm"
        >
          <option value="">Selecione...</option>
          {TIPOS_ORG.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cidade" className="font-body text-sm font-medium">
          Cidade
        </label>
        <Input
          id="cidade"
          name="cidade"
          ref={cidadeRef}
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="uf" className="font-body text-sm font-medium">
          Estado (UF)
        </label>
        <Input
          id="uf"
          name="uf"
          ref={ufRef}
          maxLength={2}
          value={uf}
          onChange={(e) => setUf(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="familias" className="font-body text-sm font-medium">
          Número de famílias
        </label>
        <Input
          id="familias"
          name="familias"
          type="number"
          min={0}
          ref={familiasRef}
          value={familias}
          onChange={(e) => setFamilias(e.target.value)}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="anosAtividade" className="font-body text-sm font-medium">
          Tempo de atividade (anos)
        </label>
        <Input
          id="anosAtividade"
          name="anosAtividade"
          type="number"
          min={0}
          ref={anosRef}
          value={anosAtividade}
          onChange={(e) => setAnosAtividade(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="recebeVisitas"
          name="recebeVisitas"
          checked={recebeVisitas}
          onCheckedChange={(checked) => setRecebeVisitas(checked === true)}
        />
        <label htmlFor="recebeVisitas" className="font-body text-sm text-foreground/80">
          Recebemos visitas de investidores
        </label>
      </div>

      {state.error && (
        <p className="font-body text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex items-center justify-between">
        <Link href="/produtor/cadastro/1" className="font-body text-sm text-foreground/70">
          Voltar
        </Link>
        <Button type="submit" disabled={pending}>
          Continuar
        </Button>
      </div>
    </form>
  );
}
