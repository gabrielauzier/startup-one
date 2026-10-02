import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  InvalidBusinessTransitionError,
  type BusinessStatus,
} from "../state-machine";

const ALL_STATUSES: BusinessStatus[] = [
  "rascunho",
  "em_analise",
  "ajuste_solicitado",
  "verificado",
  "reprovado",
  "suspenso",
  "expirado",
];

// Exatamente as transicoes do diagrama de RN-12 - nenhuma outra e' valida.
const VALID_TRANSITIONS: [BusinessStatus, BusinessStatus][] = [
  ["rascunho", "em_analise"],
  ["em_analise", "ajuste_solicitado"],
  ["ajuste_solicitado", "em_analise"],
  ["em_analise", "verificado"],
  ["em_analise", "reprovado"],
  ["verificado", "suspenso"],
  ["suspenso", "verificado"],
  ["verificado", "expirado"],
  ["expirado", "em_analise"],
];

describe("canTransition (RN-12)", () => {
  it.each(VALID_TRANSITIONS)("permite %s -> %s", (from, to) => {
    expect(canTransition(from, to)).toBe(true);
  });

  const validSet = new Set(VALID_TRANSITIONS.map(([f, t]) => `${f}->${t}`));
  const invalidPairs = ALL_STATUSES.flatMap((from) =>
    ALL_STATUSES.filter((to) => !validSet.has(`${from}->${to}`)).map(
      (to) => [from, to] as [BusinessStatus, BusinessStatus]
    )
  );

  it(`rejeita todas as ${invalidPairs.length} transições não listadas no diagrama`, () => {
    for (const [from, to] of invalidPairs) {
      expect(canTransition(from, to)).toBe(false);
    }
  });

  it("rejeita Rascunho -> Verificado direto pela API (CA-12.1)", () => {
    expect(canTransition("rascunho", "verificado")).toBe(false);
  });
});

describe("assertTransition", () => {
  it("não lança erro para uma transição válida", () => {
    expect(() => assertTransition("rascunho", "em_analise")).not.toThrow();
  });

  it("lança InvalidBusinessTransitionError para uma transição inválida", () => {
    expect(() => assertTransition("rascunho", "verificado")).toThrow(
      InvalidBusinessTransitionError
    );
  });
});
