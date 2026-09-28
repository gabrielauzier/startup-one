"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { acceptTerms, type AcceptTermsState } from "./actions";

const INITIAL_STATE: AcceptTermsState = {};

export function TermosForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, pending] = useActionState(acceptTerms, INITIAL_STATE);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="font-heading text-3xl text-primary">
        Termos de Uso e Política de Privacidade
      </h1>

      <div className="max-h-96 overflow-y-auto rounded-lg border border-border p-4 font-body text-sm text-foreground/80">
        <h2 className="font-heading text-lg text-primary">Termos de Uso</h2>
        <p className="mt-2">
          A Îasy organiza e confere informações de negócios da bioeconomia
          amazônica para conectar produtores a investidores. A Îasy não
          recebe, guarda nem transfere dinheiro: o contrato e o pagamento
          são feitos por um parceiro financeiro autorizado.
        </p>
        <h2 className="mt-4 font-heading text-lg text-primary">
          Política de Privacidade
        </h2>
        <p className="mt-2">
          Usamos seus dados para montar seu perfil e apresentá-lo às
          contrapartes relevantes. Você pode pedir a exclusão dos seus dados
          quando quiser.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="redirect" value={redirectTo} />

        {state.error && (
          <p className="font-body text-sm text-destructive">{state.error}</p>
        )}

        <Button type="submit" disabled={pending}>
          Aceitar e continuar
        </Button>
      </form>
    </main>
  );
}
