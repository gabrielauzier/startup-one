import { describe, it, expect } from "vitest";
import { passwordRequirementMessage, validatePassword } from "../password";

describe("validatePassword (RN-52)", () => {
  it.each([
    ["7 caracteres falha min", "abcde12", ["min"]],
    ["73 caracteres falha max", "a1" + "b".repeat(71), ["max"]],
    ["sem numero falha digit", "somenteletras", ["digit"]],
    ["sem letra falha letter", "12345678", ["letter"]],
  ])("%s", (_nome, pw, missing) => {
    const result = validatePassword(pw);
    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(missing);
  });

  it("abc12345 passa", () => {
    expect(validatePassword("abc12345")).toEqual({ ok: true, missing: [] });
  });

  it("72 caracteres validos passa", () => {
    expect(validatePassword("a1" + "b".repeat(70)).ok).toBe(true);
  });

  it("acumula todos os requisitos faltantes", () => {
    expect(validatePassword("!!!").missing).toEqual(["min", "letter", "digit"]);
  });

  it("aceita letras acentuadas como letra", () => {
    expect(validatePassword("açaí1234").ok).toBe(true);
  });
});

describe("passwordRequirementMessage", () => {
  it("devolve o texto pt-BR de cada requisito faltante", () => {
    expect(passwordRequirementMessage(["digit"])).toBe("Inclua ao menos 1 número.");
    expect(passwordRequirementMessage(["min", "letter"])).toBe(
      "Use ao menos 8 caracteres. Inclua ao menos 1 letra."
    );
  });

  it("devolve vazio quando nada falta", () => {
    expect(passwordRequirementMessage([])).toBe("");
  });
});
