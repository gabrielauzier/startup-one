"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
          value={nome}
          onChange={(e) => setNome(e.target.value)}
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
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          value={cnpj}
          onChange={(e) => setCnpj(e.target.value)}
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
          checked={autorizacao}
          onCheckedChange={(checked) => setAutorizacao(checked === true)}
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
