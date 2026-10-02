import { describe, it, expect } from "vitest";
import { emptyChecklist, isChecklistComplete, isValidMotivo } from "../checklist";

describe("isChecklistComplete (RN-18/CA-18.1)", () => {
  it("e' falso quando todo mundo esta desmarcado", () => {
    expect(isChecklistComplete(emptyChecklist())).toBe(false);
  });

  it("e' falso quando falta 1 item", () => {
    const checklist = {
      cnpj_ativo: true,
      documento_terra_legivel: true,
      fotos_compativeis: true,
      producao_coerente: true,
      praticas_plausiveis: false,
    };
    expect(isChecklistComplete(checklist)).toBe(false);
  });

  it("e' verdadeiro quando todos os 5 itens estao marcados", () => {
    const checklist = {
      cnpj_ativo: true,
      documento_terra_legivel: true,
      fotos_compativeis: true,
      producao_coerente: true,
      praticas_plausiveis: true,
    };
    expect(isChecklistComplete(checklist)).toBe(true);
  });
});

describe("isValidMotivo (RN-18)", () => {
  it("rejeita motivo com menos de 20 caracteres", () => {
    expect(isValidMotivo("muito curto")).toBe(false);
  });

  it("aceita motivo com exatamente 20 caracteres", () => {
    expect(isValidMotivo("a".repeat(20))).toBe(true);
  });

  it("ignora espacos nas pontas ao contar o tamanho", () => {
    expect(isValidMotivo("   " + "a".repeat(19) + "   ")).toBe(false);
  });
});
