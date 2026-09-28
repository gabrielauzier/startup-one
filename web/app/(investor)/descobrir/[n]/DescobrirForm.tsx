"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { saveAnswers } from "../actions";
import { TOTAL_QUESTIONS, type DiscoveryAnswers } from "../types";
import {
  DISCOVERY_IMPACT_OPTIONS,
  FAIXA_VALOR_OPTIONS,
  PRAZO_OPTIONS,
  PRIORIDADE_OPTIONS,
  PRODUTO_OPTIONS,
  TODOS_PRODUTOS,
} from "../questions-data";

/**
 * RF-17/RN-22: as 5 perguntas da descoberta guiada, uma por tela.
 * Mantem o rascunho completo em estado local (inicializado das
 * respostas ja' salvas, CA-22.4) e chama `saveAnswers` a cada
 * Voltar/Continuar/Pular, para nunca perder progresso ao navegar.
 */
export function DescobrirForm({ n, answers }: { n: number; answers: DiscoveryAnswers }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [prioridade, setPrioridade] = useState(answers.prioridade);
  const [faixaValor, setFaixaValor] = useState(answers.faixaValor);
  const [produtos, setProdutos] = useState<string[]>(answers.produtos ?? []);
  const [prazoMaxMeses, setPrazoMaxMeses] = useState(answers.prazoMaxMeses);
  const [impactos, setImpactos] = useState<string[]>(answers.impactos ?? []);

  function currentDraft(overrides: Partial<DiscoveryAnswers> = {}): DiscoveryAnswers {
    return { prioridade, faixaValor, produtos, prazoMaxMeses, impactos, ...overrides };
  }

  function goTo(target: number, draft: DiscoveryAnswers) {
    startTransition(async () => {
      await saveAnswers(draft);
      if (target > TOTAL_QUESTIONS) {
        router.push("/descobrir/resultados");
      } else {
        router.push(`/descobrir/${target}`);
      }
    });
  }

  // CA-22.2: marcar "Todos" desmarca as demais opções, e vice-versa.
  function toggleProduto(value: string) {
    setProdutos((prev) => {
      if (value === TODOS_PRODUTOS) {
        return prev.includes(TODOS_PRODUTOS) ? [] : [TODOS_PRODUTOS];
      }
      const semTodos = prev.filter((p) => p !== TODOS_PRODUTOS);
      return semTodos.includes(value)
        ? semTodos.filter((p) => p !== value)
        : [...semTodos, value];
    });
  }

  function toggleImpacto(value: string) {
    setImpactos((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]
    );
  }

  // CA-22.1: pergunta 3 sem produto marcado mantém Continuar desabilitado.
  const canContinue =
    (n === 1 && Boolean(prioridade)) ||
    (n === 2 && Boolean(faixaValor)) ||
    (n === 3 && produtos.length > 0) ||
    (n === 4 && Boolean(prazoMaxMeses)) ||
    n === 5;

  return (
    <div className="flex flex-col gap-6">
      <p className="font-body text-sm text-muted-foreground">
        Pergunta {n} de {TOTAL_QUESTIONS}
      </p>

      {n === 1 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="font-heading text-lg">O que pesa mais para você?</legend>
          {PRIORIDADE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 font-body text-sm">
              <input
                type="radio"
                name="prioridade"
                value={opt.value}
                checked={prioridade === opt.value}
                onChange={() => setPrioridade(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </fieldset>
      )}

      {n === 2 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="font-heading text-lg">Quanto você pretende colocar?</legend>
          {FAIXA_VALOR_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 font-body text-sm">
              <input
                type="radio"
                name="faixaValor"
                value={opt.value}
                checked={faixaValor === opt.value}
                onChange={() => setFaixaValor(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </fieldset>
      )}

      {n === 3 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="font-heading text-lg">Quais produtos te interessam?</legend>
          {[...PRODUTO_OPTIONS, TODOS_PRODUTOS].map((produto) => (
            <label key={produto} className="flex items-center gap-2 font-body text-sm">
              <Checkbox
                checked={produtos.includes(produto)}
                onCheckedChange={() => toggleProduto(produto)}
              />
              {produto}
            </label>
          ))}
        </fieldset>
      )}

      {n === 4 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="font-heading text-lg">Qual o prazo que você aceita?</legend>
          {PRAZO_OPTIONS.map((prazo) => (
            <label key={prazo} className="flex items-center gap-2 font-body text-sm">
              <input
                type="radio"
                name="prazoMaxMeses"
                value={prazo}
                checked={prazoMaxMeses === prazo}
                onChange={() => setPrazoMaxMeses(prazo)}
              />
              Até {prazo} meses
            </label>
          ))}
        </fieldset>
      )}

      {n === 5 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="font-heading text-lg">
            O que mais importa para você? (opcional)
          </legend>
          {DISCOVERY_IMPACT_OPTIONS.map((impacto) => (
            <label key={impacto} className="flex items-center gap-2 font-body text-sm">
              <Checkbox
                checked={impactos.includes(impacto)}
                onCheckedChange={() => toggleImpacto(impacto)}
              />
              {impacto}
            </label>
          ))}
        </fieldset>
      )}

      <div className="flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="outline"
          disabled={n === 1 || isPending}
          onClick={() => goTo(n - 1, currentDraft())}
        >
          Voltar
        </Button>
        <div className="flex items-center gap-3">
          {n === 5 && (
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => goTo(TOTAL_QUESTIONS + 1, currentDraft({ impactos: [] }))}
            >
              Pular esta pergunta
            </Button>
          )}
          <Button
            type="button"
            disabled={!canContinue || isPending}
            onClick={() => goTo(n + 1, currentDraft())}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
