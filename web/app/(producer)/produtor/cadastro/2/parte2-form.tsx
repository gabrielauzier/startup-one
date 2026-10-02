"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PartHeader } from "@/components/cadastro/PartHeader";
import { CadastroFooter } from "@/components/cadastro/CadastroFooter";
import { RadioCard } from "@/components/cadastro/RadioCard";
import { AjusteComment, LockedHiddenValue, isFieldLocked } from "@/components/cadastro/AjusteFieldNote";
import { useDraftSync } from "@/lib/offline/use-draft-sync";
import { BRAZIL_UFS } from "@/lib/validation/amazonia-legal";
import type { FieldAjusteInfo } from "@/lib/business/adjustable-fields";
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

export function Parte2Form({
  businessId,
  draft,
  ajuste = null,
}: {
  businessId: string;
  draft: Parte2Draft;
  ajuste?: FieldAjusteInfo | null;
}) {
  const [state, formAction, pending] = useActionState(submitParte2, INITIAL_STATE);
  const { status, saveDraft } = useDraftSync(businessId, 2);

  const nomeRef = useRef<HTMLInputElement>(null);
  const cidadeRef = useRef<HTMLInputElement>(null);
  const ufRef = useRef<HTMLSelectElement>(null);
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
    const refs: Record<string, React.RefObject<{ focus: () => void } | null>> = {
      nome: nomeRef,
      cidade: cidadeRef,
      uf: ufRef,
      familias: familiasRef,
      anosAtividade: anosRef,
    };
    refs[state.field]?.current?.focus();
  }, [state.field, state.error]);

  // CA-07.1: salva cada mudanca relevante no aparelho (debounced).
  useEffect(() => {
    const timer = setTimeout(() => {
      void saveDraft({
        nome,
        tipoOrg,
        cidade,
        uf,
        familias: familias ? Number(familias) : undefined,
        anosAtividade: anosAtividade ? Number(anosAtividade) : undefined,
        recebeVisitas,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [nome, tipoOrg, cidade, uf, familias, anosAtividade, recebeVisitas, saveDraft]);

  if (state.outOfScope) {
    return (
      <div className="flex flex-col gap-4">
        <PartHeader part={2} title="Seu negócio" status={status} backHref="/produtor/cadastro/1" />
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
      <PartHeader part={2} title="Seu negócio" status={status} backHref="/produtor/cadastro/1" />
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
          readOnly={isFieldLocked(ajuste, "nome")}
        />
        <AjusteComment ajuste={ajuste} campo="nome" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="font-body text-sm font-medium">Tipo de organização</label>
        <div role="radiogroup" aria-label="Tipo de organização" className="flex flex-wrap gap-2">
          {TIPOS_ORG.map((t) => (
            <RadioCard
              key={t.value}
              selected={tipoOrg === t.value}
              onSelect={() => setTipoOrg(t.value)}
              disabled={isFieldLocked(ajuste, "tipoOrg")}
            >
              {t.label}
            </RadioCard>
          ))}
        </div>
        {!isFieldLocked(ajuste, "tipoOrg") && (
          <input type="hidden" name="tipoOrg" value={tipoOrg} />
        )}
        <LockedHiddenValue ajuste={ajuste} campo="tipoOrg" name="tipoOrg" value={tipoOrg} />
        <AjusteComment ajuste={ajuste} campo="tipoOrg" />
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            readOnly={isFieldLocked(ajuste, "cidade")}
          />
          <AjusteComment ajuste={ajuste} campo="cidade" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="uf" className="font-body text-sm font-medium">
            Estado (UF)
          </label>
          <select
            id="uf"
            name="uf"
            ref={ufRef}
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            required
            disabled={isFieldLocked(ajuste, "uf")}
            className="rounded-md border border-border bg-white px-3 py-2 font-body text-sm disabled:opacity-50"
          >
            <option value="">Selecione...</option>
            {BRAZIL_UFS.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
          <LockedHiddenValue ajuste={ajuste} campo="uf" name="uf" value={uf} />
          <AjusteComment ajuste={ajuste} campo="uf" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            readOnly={isFieldLocked(ajuste, "familias")}
          />
          <AjusteComment ajuste={ajuste} campo="familias" />
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
            readOnly={isFieldLocked(ajuste, "anosAtividade")}
          />
          <AjusteComment ajuste={ajuste} campo="anosAtividade" />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5">
        <Checkbox
          id="recebeVisitas"
          name="recebeVisitas"
          checked={recebeVisitas}
          onCheckedChange={(checked) => setRecebeVisitas(checked === true)}
          disabled={isFieldLocked(ajuste, "recebeVisitas")}
        />
        {recebeVisitas && (
          <LockedHiddenValue
            ajuste={ajuste}
            campo="recebeVisitas"
            name="recebeVisitas"
            value="on"
          />
        )}
        <label htmlFor="recebeVisitas" className="font-body text-sm text-foreground/80">
          Recebemos visitas de investidores
        </label>
        <AjusteComment ajuste={ajuste} campo="recebeVisitas" />
      </div>

      {state.error && (
        <p className="font-body text-sm text-destructive">{state.error}</p>
      )}

      <CadastroFooter pending={pending} />
    </form>
  );
}
