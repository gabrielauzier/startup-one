import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const config = readFileSync(join(__dirname, "../../../supabase/config.toml"), "utf-8");

/** Corpo de uma secao `[nome]` do TOML, ate a proxima secao. */
function section(name: string): string {
  const header = new RegExp(`^\\[${name.replace(/\./g, "\\.")}\\]`, "m");
  const after = config.split(header)[1];
  expect(after, `secao [${name}] ausente`).toBeDefined();
  const next = after!.search(/^\[/m);
  return next === -1 ? after! : after!.slice(0, next);
}

function value(body: string, key: string): string | undefined {
  return body.match(new RegExp(`^\\s*${key}\\s*=\\s*(.+)$`, "m"))?.[1].trim();
}

describe("supabase/config.toml [auth] (AUTH-02, AUTH-12)", () => {
  it("exige senha de no minimo 8 caracteres com letras e digitos", () => {
    const auth = section("auth");
    expect(value(auth, "minimum_password_length")).toBe("8");
    expect(value(auth, "password_requirements")).toBe('"letters_digits"');
  });

  it("libera o padrao /** das origens locais e do e2e em additional_redirect_urls", () => {
    const auth = section("auth");
    const urls = auth.slice(auth.indexOf("additional_redirect_urls"));
    expect(urls).toContain('"http://127.0.0.1:3000/**"');
    expect(urls).toContain('"http://localhost:3000/**"');
    expect(urls).toContain('"http://localhost:3100/**"');
  });

  it("exige confirmacao de e-mail no cadastro", () => {
    expect(value(section("auth.email"), "enable_confirmations")).toBe("true");
  });

  it("limita o reenvio de e-mail de auth a 1 a cada 60 s por usuario", () => {
    expect(value(section("auth.email"), "max_frequency")).toBe('"60s"');
  });
});
