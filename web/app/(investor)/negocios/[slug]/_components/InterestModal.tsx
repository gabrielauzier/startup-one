"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  INTEREST_CONFIRMATION_TEXT,
  INTEREST_MAX_MENSAGEM_LENGTH,
  INTEREST_MIN_VALOR,
} from "@/lib/business/interest-confirmation";
import { createInterest } from "../actions";

/**
 * RF-26/RN-36/RN-38/CA-36.2/CA-38.1: modal "Tenho interesse" - valor
 * (mínimo R$1.000, máximo = "Busca R$ X" do negócio), mensagem
 * opcional (até 500 caracteres), confirmação obrigatória de que ainda
 * não é investimento. `useState` controlado por campo (não
 * `<form action=...>`) de propósito: React 19 reseta inputs não
 * controlados de um form Server Action após qualquer submissão, e
 * este modal precisa manter o valor digitado quando o servidor
 * recusa (ex.: CA-36.2) - mesmo padrão já usado em
 * `SuspensaoPanel.tsx` (T30).
 */
export function InterestModal({
  slug,
  businessId,
  valorBusca,
  autoOpen = false,
}: {
  slug: string;
  businessId: string;
  valorBusca: number;
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(autoOpen);
  const [valor, setValor] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const valorNumero = Number(valor);
  const valorAcimaDoLimite = valor.trim().length > 0 && valorNumero > valorBusca;
  const valorValido =
    valor.trim().length > 0 && Number.isFinite(valorNumero) && valorNumero >= INTEREST_MIN_VALOR && !valorAcimaDoLimite;
  const podeEnviar = valorValido && confirmado && !pending;

  if (!open) {
    return (
      <Button type="button" data-testid="botao-tenho-interesse" onClick={() => setOpen(true)}>
        Tenho interesse
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tenho interesse"
        data-testid="interesse-modal"
        className="flex w-full max-w-md flex-col gap-3 rounded-lg bg-background p-6"
      >
        <h2 className="font-heading text-lg">Tenho interesse</h2>
        <p className="font-body text-xs text-muted-foreground">
          Isso ainda não é um investimento - é um jeito de avisar a produtora que você quer
          conversar.
        </p>

        <div className="flex flex-col gap-1">
          <label htmlFor="interesse-valor" className="font-body text-sm font-medium">
            Valor que você tem interesse em investir
          </label>
          <Input
            id="interesse-valor"
            data-testid="interesse-valor"
            type="number"
            min={INTEREST_MIN_VALOR}
            max={valorBusca}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          {valorAcimaDoLimite && (
            <p data-testid="interesse-valor-erro" className="font-body text-xs text-destructive">
              O valor não pode passar do que o negócio busca
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="interesse-mensagem" className="font-body text-sm font-medium">
            Mensagem (opcional)
          </label>
          <textarea
            id="interesse-mensagem"
            data-testid="interesse-mensagem"
            value={mensagem}
            maxLength={INTEREST_MAX_MENSAGEM_LENGTH}
            onChange={(e) => setMensagem(e.target.value)}
            rows={3}
            className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 font-body text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <p className="font-body text-xs text-muted-foreground">
            {mensagem.length}/{INTEREST_MAX_MENSAGEM_LENGTH}
          </p>
        </div>

        <label className="flex items-start gap-2 font-body text-sm">
          <Checkbox
            data-testid="interesse-confirmacao"
            checked={confirmado}
            onCheckedChange={(checked) => setConfirmado(checked === true)}
          />
          {INTEREST_CONFIRMATION_TEXT}
        </label>

        {error && (
          <p data-testid="interesse-erro" className="font-body text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button
            type="button"
            data-testid="enviar-interesse"
            disabled={!podeEnviar}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await createInterest(
                  slug,
                  businessId,
                  valorNumero,
                  mensagem,
                  confirmado
                );
                if (result && !result.ok) {
                  setError(result.error ?? "Não foi possível enviar o interesse.");
                }
                // Em caso de sucesso, createInterest redireciona (redirect()
                // lança e nunca retorna aqui) - nada mais a fazer.
              })
            }
          >
            Enviar interesse
          </Button>
        </div>
      </div>
    </div>
  );
}
