import { describe, it, expect } from "vitest";
import { formatPhoneBR, unformat } from "../masks";

describe("formatPhoneBR", () => {
  it("formata progressivamente enquanto digita", () => {
    expect(formatPhoneBR("9")).toBe("9");
    expect(formatPhoneBR("91")).toBe("91");
    expect(formatPhoneBR("919")).toBe("(91) 9");
    expect(formatPhoneBR("91999")).toBe("(91) 999");
    expect(formatPhoneBR("919999999")).toBe("(91) 9999-999");
  });

  it("formata celular completo (9 dígitos + DDD)", () => {
    expect(formatPhoneBR("91999999999")).toBe("(91) 99999-9999");
  });

  it("formata fixo completo (8 dígitos + DDD)", () => {
    expect(formatPhoneBR("9199999999")).toBe("(91) 9999-9999");
  });

  it("ignora dígitos além do 11º", () => {
    expect(formatPhoneBR("919999999991234")).toBe("(91) 99999-9999");
  });

  it("é idempotente sobre um valor já formatado", () => {
    expect(formatPhoneBR("(91) 99999-9999")).toBe("(91) 99999-9999");
  });

  it("string vazia continua vazia", () => {
    expect(formatPhoneBR("")).toBe("");
  });

  it("ignora caracteres não numéricos", () => {
    expect(formatPhoneBR("abc91def999999999")).toBe("(91) 99999-9999");
  });
});

describe("unformat", () => {
  it("remove toda formatação, deixando só dígitos", () => {
    expect(unformat("(91) 99999-9999")).toBe("91999999999");
    expect(unformat("00.000.000/0001-00")).toBe("00000000000100");
    expect(unformat("")).toBe("");
  });
});
