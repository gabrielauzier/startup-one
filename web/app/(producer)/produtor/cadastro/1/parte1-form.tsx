"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PartHeader } from "@/components/cadastro/PartHeader";
import { AjusteComment, LockedHiddenValue, isFieldLocked } from "@/components/cadastro/AjusteFieldNote";
import { useDraftSync } from "@/lib/offline/use-draft-sync";
import type { FieldAjusteInfo } from "@/lib/business/adjustable-fields";
import { submitParte1, type Parte1State } from "./actions";

const INITIAL_STATE: Parte1State = {};

export interface Parte1Draft {
  nome?: string;
  telefone?: string;
  email?: string;
  cnpj?: string;
  autorizacao?: boolean;
}

export function Parte1Form({
  businessId,
  draft,
  ajuste = null,
}: {
  businessId: string;
  draft: Parte1Draft;
  ajuste?: FieldAjusteInfo | null;
}) {
  const [state, formAction, pending] = useActionState(submitParte1, INITIAL_STATE);
  const { status, saveDraft } = useDraftSync(businessId, 1);

  const nomeRef = useRef<HTMLInputElement>(null);
  const telefoneRef = useRef<HTMLInputElement>(null);
  const cnpjRef = useRef<HTMLInputElement>(null);

  // Controlado no cliente: apos um Server Action rodar (sucesso ou
  // erro), React reseta inputs nao-controlados do formulario - sem
  // isso, um erro num campo (ex.: CNPJ) apagaria os demais ja
  // preenchidos.
  const [nome, setNome] = useState(() => draft.nome ?? "");
  const [telefone, setTelefone] = useState(() => draft.telefone ?? "");
  const [email, setEmail] = useState(() => draft.email ?? "");
  const [cnpj, setCnpj] = useState(() => draft.cnpj ?? "");
  const [autorizacao, setAutorizacao] = useState(() => draft.autorizacao ?? false);

  // CA-06.1: mantem o foco no primeiro campo invalido com a mensagem de erro.
  useEffect(() => {
    if (!state.field) return;
    const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {
      nome: nomeRef,
      telefone: telefoneRef,
      cnpj: cnpjRef,
    };
    refs[state.field]?.current?.focus();
  }, [state.field, state.error]);

  // CA-07.1: salva cada mudanca relevante no aparelho (debounced), para
  // nao perder nada se a conexao cair no meio do preenchimento.
  useEffect(() => {
    const timer = setTimeout(() => {
      void saveDraft({ nome, telefone, email, cnpj, autorizacao });
    }, 400);
    return () => clearTimeout(timer);
  }, [nome, telefone, email, cnpj, autorizacao, saveDraft]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <PartHeader part={1} title="Sobre você" status={status} />
      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className="font-body text-sm font-medium">
          Seu nome
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
        <label htmlFor="telefone" className="font-body text-sm font-medium">
          Telefone com WhatsApp
        </label>
        <Input
          id="telefone"
          name="telefone"
          type="tel"
          ref={telefoneRef}
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          required
          readOnly={isFieldLocked(ajuste, "telefone")}
        />
        <AjusteComment ajuste={ajuste} campo="telefone" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="font-body text-sm font-medium">
          E-mail (opcional)
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={isFieldLocked(ajuste, "email")}
        />
        <AjusteComment ajuste={ajuste} campo="email" />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cnpj" className="font-body text-sm font-medium">
          CNPJ
        </label>
        <Input
          id="cnpj"
          name="cnpj"
          ref={cnpjRef}
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
          required
          readOnly={isFieldLocked(ajuste, "cnpj")}
        />
        {state.field === "cnpj" && (
          <p className="font-body text-sm text-destructive">
            {state.error ?? "CNPJ inválido"}
          </p>
        )}
        <AjusteComment ajuste={ajuste} campo="cnpj" />
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="autorizacao"
          name="autorizacao"
          checked={autorizacao}
          onCheckedChange={(checked) => setAutorizacao(checked === true)}
          disabled={isFieldLocked(ajuste, "autorizacao")}
        />
        {autorizacao && (
          <LockedHiddenValue
            ajuste={ajuste}
            campo="autorizacao"
            name="autorizacao"
            value="on"
          />
        )}
        <label htmlFor="autorizacao" className="font-body text-sm text-foreground/80">
          Autorizo a Îasy a usar estes dados para montar meu perfil e
          apresentá-lo a investidores. Posso pedir a exclusão quando quiser.
        </label>
        <AjusteComment ajuste={ajuste} campo="autorizacao" />
      </div>

      {state.error && state.field !== "cnpj" && (
        <p className="font-body text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex items-center justify-between">
        <Link href="/produtor" className="font-body text-sm text-foreground/70">
          Voltar
        </Link>
        <Button type="submit" disabled={pending}>
          Continuar
        </Button>
      </div>
    </form>
  );
}
