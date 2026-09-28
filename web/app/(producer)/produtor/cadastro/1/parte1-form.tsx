"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { submitParte1, type Parte1State } from "./actions";

const INITIAL_STATE: Parte1State = {};

export interface Parte1Draft {
  nome?: string;
  telefone?: string;
  email?: string;
  cnpj?: string;
  autorizacao?: boolean;
}

export function Parte1Form({ draft }: { draft: Parte1Draft }) {
  const [state, formAction, pending] = useActionState(submitParte1, INITIAL_STATE);

  const nomeRef = useRef<HTMLInputElement>(null);
  const telefoneRef = useRef<HTMLInputElement>(null);
  const cnpjRef = useRef<HTMLInputElement>(null);
  const autorizacaoRef = useRef<HTMLInputElement>(null);

  // CA-06.1: mantem o foco no primeiro campo invalido com a mensagem de erro.
  useEffect(() => {
    if (!state.field) return;
    const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {
      nome: nomeRef,
      telefone: telefoneRef,
      cnpj: cnpjRef,
      autorizacao: autorizacaoRef,
    };
    refs[state.field]?.current?.focus();
  }, [state.field, state.error]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nome" className="font-body text-sm font-medium">
          Seu nome
        </label>
        <Input
          id="nome"
          name="nome"
          ref={nomeRef}
          defaultValue={draft.nome ?? ""}
          required
        />
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
          defaultValue={draft.telefone ?? ""}
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="font-body text-sm font-medium">
          E-mail (opcional)
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={draft.email ?? ""}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="cnpj" className="font-body text-sm font-medium">
          CNPJ
        </label>
        <Input
          id="cnpj"
          name="cnpj"
          ref={cnpjRef}
          defaultValue={draft.cnpj ?? ""}
          required
        />
        {state.field === "cnpj" && (
          <p className="font-body text-sm text-destructive">CNPJ inválido</p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="autorizacao"
          name="autorizacao"
          ref={autorizacaoRef}
          defaultChecked={draft.autorizacao ?? false}
        />
        <label htmlFor="autorizacao" className="font-body text-sm text-foreground/80">
          Autorizo a Îasy a usar estes dados para montar meu perfil e
          apresentá-lo a investidores. Posso pedir a exclusão quando quiser.
        </label>
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
