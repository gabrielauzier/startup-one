"use client";

import { useState, useTransition } from "react";
import { editInterestValue } from "./actions";

/**
 * RN-36/T51: edita o valor de um interesse Pendente, com o mesmo
 * limite do "Busca R$ X" do negócio já aplicado em `InterestModal`
 * (T46) - `useState` controlado de propósito (não `<form action=...>`
 * puro), mesmo motivo documentado lá: um erro do servidor não pode
 * resetar o campo que o investidor já editou.
 */
export function EditInterestForm({
  interestId,
  valorAtual,
  valorBusca,
}: {
  interestId: string;
  valorAtual: number;
  valorBusca: number;
}) {
  const [editing, setEditing] = useState(false);
  const [valor, setValor] = useState(String(valorAtual));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        data-testid="editar-interesse"
        onClick={() => setEditing(true)}
        className="rounded-lg border border-input px-3 py-1.5 font-body text-sm"
      >
        Editar valor
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="number"
          data-testid="editar-interesse-valor"
          value={valor}
          min={1000}
          max={valorBusca}
          onChange={(e) => setValor(e.target.value)}
          className="w-32 rounded-lg border border-input bg-white px-2.5 py-1.5 font-body text-sm"
        />
        <button
          type="button"
          data-testid="salvar-interesse-valor"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await editInterestValue(interestId, Number(valor));
              if (result.ok) {
                setEditing(false);
              } else {
                setError(result.error ?? "Não foi possível salvar.");
              }
            })
          }
          className="rounded-lg bg-primary px-3 py-1.5 font-body text-sm font-medium text-primary-foreground"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setValor(String(valorAtual));
            setError(null);
          }}
          className="rounded-lg border border-input px-3 py-1.5 font-body text-sm"
        >
          Cancelar edição
        </button>
      </div>
      {error && (
        <p data-testid="editar-interesse-erro" className="font-body text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
