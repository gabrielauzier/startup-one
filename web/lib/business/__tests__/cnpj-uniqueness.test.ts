import { describe, it, expect } from "vitest";
import { mapCnpjUniqueViolation, CNPJ_DUPLICADO_MESSAGE } from "../cnpj-uniqueness";

describe("mapCnpjUniqueViolation (CA-05.3)", () => {
  it("mapeia o codigo 23505 (unique_violation) para a mensagem de CNPJ duplicado", () => {
    expect(mapCnpjUniqueViolation({ code: "23505" })).toBe(CNPJ_DUPLICADO_MESSAGE);
  });

  it("devolve null para qualquer outro codigo de erro", () => {
    expect(mapCnpjUniqueViolation({ code: "23502" })).toBeNull();
    expect(mapCnpjUniqueViolation({ code: undefined })).toBeNull();
  });

  it("devolve null quando nao ha erro", () => {
    expect(mapCnpjUniqueViolation(null)).toBeNull();
    expect(mapCnpjUniqueViolation(undefined)).toBeNull();
  });
});
