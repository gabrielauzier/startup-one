import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * RN-02: o codigo OTP de 6 digitos deve valer por 10 minutos (600s), e
 * nao os 60 minutos padrao do GoTrue. A expiracao e' inteiramente do
 * lado do servidor Supabase local (nao ha verificacao de app-level
 * possivel), entao este teste "trava" o valor lendo config.toml
 * diretamente - se alguem reverter para o default do GoTrue (3600)
 * sem querer, este teste falha.
 */
describe("supabase/config.toml [auth.email] (RN-02)", () => {
  it("otp_expiry esta configurado para 600 segundos (10 minutos)", () => {
    const configPath = join(__dirname, "../../../supabase/config.toml");
    const config = readFileSync(configPath, "utf-8");

    const authEmailSection = config.split(/^\[auth\.email\]/m)[1];
    expect(authEmailSection).toBeDefined();

    const nextSectionIndex = authEmailSection!.search(/^\[/m);
    const sectionBody =
      nextSectionIndex === -1
        ? authEmailSection!
        : authEmailSection!.slice(0, nextSectionIndex);

    const match = sectionBody.match(/^\s*otp_expiry\s*=\s*(\d+)/m);
    expect(match).not.toBeNull();

    const otpExpiry = Number(match![1]);
    expect(otpExpiry).toBe(600);
  });
});
