import { describe, it, expect } from "vitest";
import { isValidNota, validateNotas, seloValidoAte } from "../notas";

describe("isValidNota (RN-19/CA-19.1)", () => {
  it("aceita inteiros entre 0 e 100", () => {
    expect(isValidNota(0)).toBe(true);
    expect(isValidNota(100)).toBe(true);
    expect(isValidNota(94)).toBe(true);
  });

  it("rejeita nota decimal (CA-19.1)", () => {
    expect(isValidNota(94.5)).toBe(false);
  });

  it("rejeita nota negativa", () => {
    expect(isValidNota(-1)).toBe(false);
  });

  it("rejeita nota acima de 100", () => {
    expect(isValidNota(101)).toBe(false);
  });

  it("rejeita NaN", () => {
    expect(isValidNota(Number.NaN)).toBe(false);
  });
});

describe("validateNotas", () => {
  it("falha se qualquer uma das 3 notas for invalida", () => {
    const result = validateNotas(94, 91.5, 86);
    expect(result.ok).toBe(false);
  });

  it("passa quando as 3 sao inteiras validas", () => {
    const result = validateNotas(94, 91, 86);
    expect(result).toEqual({ ok: true });
  });
});

describe("seloValidoAte (RN-19)", () => {
  it("concede o selo por 12 meses a partir da aprovacao", () => {
    const verificadoEm = new Date("2026-10-01T00:00:00Z");
    const validade = seloValidoAte(verificadoEm);
    expect(validade.toISOString()).toBe("2027-10-01T00:00:00.000Z");
  });
});
