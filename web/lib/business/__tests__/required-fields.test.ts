import { describe, it, expect } from "vitest";
import { validateRequiredFields } from "../required-fields";
import type { DraftData } from "../draft";

function completeDraft(): DraftData {
  return {
    part1: { nome: "Raimunda", telefone: "91999999999", cnpj: "x", autorizacao: true },
    part2: {
      nome: "Cooperativa",
      tipoOrg: "cooperativa",
      cidade: "Cametá",
      uf: "PA",
      familias: 10,
      anosAtividade: 5,
    },
    part3: { produtos: ["Açaí"], producaoMensalKg: 100, praticas: ["x"] },
    part4: {},
    part5: { finalidade: "obras", valorBusca: 100000, prazoMeses: 24, retornoProposto: 10 },
  };
}

describe("validateRequiredFields (RN-06, RF-12)", () => {
  it("aceita um rascunho completo com evidencias obrigatorias", () => {
    const result = validateRequiredFields(completeDraft(), { onde_produz: 1, produto: 1 });
    expect(result).toEqual({ ok: true, missing: [] });
  });

  it("rejeita sem autorizacao marcada", () => {
    const draft = completeDraft();
    draft.part1.autorizacao = false;
    const result = validateRequiredFields(draft, { onde_produz: 1, produto: 1 });
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("Parte 1: autorização de uso de dados");
  });

  it("rejeita sem foto obrigatoria (RN-08)", () => {
    const result = validateRequiredFields(completeDraft(), { onde_produz: 0, produto: 1 });
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("Parte 4: foto de onde vocês produzem");
  });

  it("rejeita sem produto ou pratica na parte 3", () => {
    const draft = completeDraft();
    draft.part3.produtos = [];
    draft.part3.praticas = [];
    const result = validateRequiredFields(draft, { onde_produz: 1, produto: 1 });
    expect(result.missing).toEqual(
      expect.arrayContaining(["Parte 3: ao menos 1 produto", "Parte 3: ao menos 1 prática"])
    );
  });

  it("rejeita sem valor/prazo/retorno na parte 5", () => {
    const draft = completeDraft();
    draft.part5 = {};
    const result = validateRequiredFields(draft, { onde_produz: 1, produto: 1 });
    expect(result.missing).toEqual(
      expect.arrayContaining([
        "Parte 5: finalidade",
        "Parte 5: valor",
        "Parte 5: prazo",
        "Parte 5: retorno proposto",
      ])
    );
  });
});
