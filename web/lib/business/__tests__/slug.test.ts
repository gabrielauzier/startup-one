import { describe, it, expect } from "vitest";
import { slugifyBusinessName, buildBusinessSlug } from "../slug";

describe("slugifyBusinessName", () => {
  it("remove acentos, minusculiza e troca espacos por hifen", () => {
    expect(slugifyBusinessName("Castanha Solidária Xingu")).toBe(
      "castanha-solidaria-xingu"
    );
  });

  it("remove caracteres nao alfanumericos", () => {
    expect(slugifyBusinessName("Açaí & Cia. Ltda!")).toBe("acai-cia-ltda");
  });
});

describe("buildBusinessSlug", () => {
  it("combina o slug do nome com um fragmento do id do negocio", () => {
    expect(buildBusinessSlug("Cooperativa Teste", "abcdef1234567890")).toBe(
      "cooperativa-teste-abcdef12"
    );
  });

  it("usa 'negocio' quando o nome fica vazio apos slugificar", () => {
    expect(buildBusinessSlug("!!!", "abcdef1234567890")).toBe("negocio-abcdef12");
  });
});
