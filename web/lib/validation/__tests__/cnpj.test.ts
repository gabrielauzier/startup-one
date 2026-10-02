import { describe, it, expect } from "vitest";
import { isValidCnpj, formatCnpj } from "../cnpj";

describe("isValidCnpj (RN-05, CA-05.1)", () => {
  it("aceita CNPJ valido so-digitos", () => {
    expect(isValidCnpj("11444777000161")).toBe(true);
    expect(isValidCnpj("11222333000181")).toBe(true);
  });

  it("aceita CNPJ valido formatado", () => {
    expect(isValidCnpj("11.444.777/0001-61")).toBe(true);
  });

  it("rejeita digito verificador invalido", () => {
    expect(isValidCnpj("11444777000162")).toBe(false);
    expect(isValidCnpj("11222333000180")).toBe(false);
  });

  it("rejeita sequencias repetidas", () => {
    expect(isValidCnpj("00000000000000")).toBe(false);
    expect(isValidCnpj("11111111111111")).toBe(false);
  });

  it("rejeita tamanho incorreto ou vazio", () => {
    expect(isValidCnpj("123")).toBe(false);
    expect(isValidCnpj("")).toBe(false);
  });
});

describe("formatCnpj", () => {
  it("formata 14 digitos como 00.000.000/0000-00", () => {
    expect(formatCnpj("11444777000161")).toBe("11.444.777/0001-61");
  });

  it("devolve a entrada quando nao tem 14 digitos", () => {
    expect(formatCnpj("123")).toBe("123");
  });
});
