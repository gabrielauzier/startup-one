import { describe, it, expect } from "vitest";
import { resolveAccess } from "../roles";

describe("resolveAccess", () => {
  it("permite qualquer papel e visitante sem sessao em rota publica", () => {
    expect(resolveAccess("/", null)).toEqual({ allowed: true });
    expect(resolveAccess("/negocios", "produtor")).toEqual({ allowed: true });
    expect(resolveAccess("/negocios/coop-acai-mujuu", "investidor")).toEqual({
      allowed: true,
    });
  });

  it("nega visitante sem sessao em rota privada (CA-02.3)", () => {
    expect(resolveAccess("/produtor/painel", null)).toEqual({
      allowed: false,
      reason: "no-session",
    });
    expect(resolveAccess("/verificacao", null)).toEqual({
      allowed: false,
      reason: "no-session",
    });
    expect(resolveAccess("/interesses", null)).toEqual({
      allowed: false,
      reason: "no-session",
    });
  });

  it("permite produtor em rota de produtor e nega investidor/verificador (CA-01.2)", () => {
    expect(resolveAccess("/produtor/cadastro/1", "produtor")).toEqual({
      allowed: true,
    });
    expect(resolveAccess("/produtor/painel", "investidor")).toEqual({
      allowed: false,
      reason: "wrong-role",
    });
    expect(resolveAccess("/produtor/painel", "verificador")).toEqual({
      allowed: false,
      reason: "wrong-role",
    });
  });

  it("permite verificador em rota de verificacao e nega os demais papeis", () => {
    expect(resolveAccess("/verificacao/123", "verificador")).toEqual({
      allowed: true,
    });
    expect(resolveAccess("/verificacao/123", "produtor")).toEqual({
      allowed: false,
      reason: "wrong-role",
    });
    expect(resolveAccess("/verificacao/123", "empresa")).toEqual({
      allowed: false,
      reason: "wrong-role",
    });
  });

  it("permite investidor e empresa em 'Meus interesses' e nega produtor/verificador", () => {
    expect(resolveAccess("/interesses", "investidor")).toEqual({ allowed: true });
    expect(resolveAccess("/interesses", "empresa")).toEqual({ allowed: true });
    expect(resolveAccess("/interesses", "produtor")).toEqual({
      allowed: false,
      reason: "wrong-role",
    });
  });

  it("exige investidor/empresa para documentos de um negocio, mas nao para a pagina publica dele (RN-26)", () => {
    expect(
      resolveAccess("/negocios/coop-acai-mujuu/documentos", "investidor")
    ).toEqual({ allowed: true });
    expect(
      resolveAccess("/negocios/coop-acai-mujuu/documentos", null)
    ).toEqual({ allowed: false, reason: "no-session" });
    expect(resolveAccess("/negocios/coop-acai-mujuu", null)).toEqual({
      allowed: true,
    });
  });
});
