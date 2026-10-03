import { describe, it, expect } from "vitest";
import { hashEmail, normalizeEmail } from "../email";

describe("normalizeEmail", () => {
  it("remove espacos das pontas e passa para minusculas", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
});

describe("hashEmail", () => {
  it("devolve SHA-256 hexadecimal de 64 caracteres", () => {
    expect(hashEmail("foo@bar.com")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("e deterministico e igual para variacoes de caixa e espacos", () => {
    expect(hashEmail("  FOO@bar.com ")).toBe(hashEmail("foo@bar.com"));
  });

  it("e diferente para e-mails diferentes", () => {
    expect(hashEmail("a@bar.com")).not.toBe(hashEmail("b@bar.com"));
  });

  it("nao contem o e-mail em claro", () => {
    expect(hashEmail("foo@bar.com")).not.toContain("foo");
  });
});
