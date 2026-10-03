import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../../../..");
const deploy = readFileSync(join(root, "DEPLOY.md"), "utf-8");
const config = readFileSync(join(root, "web/supabase/config.toml"), "utf-8");

describe("valores de producao de auth documentados (AUTH-10 critério 1)", () => {
  it("DEPLOY.md lista as chaves de rate limit com o valor de producao e a AUTH_COOKIE_SECRET", () => {
    expect(deploy).toMatch(/`email_sent`[^\n]*100\/h/);
    expect(deploy).toMatch(/`sign_in_sign_ups`[^\n]*30 a cada 5 min/);
    expect(deploy).toMatch(/`token_verifications`[^\n]*30 a cada 5 min/);
    expect(deploy).toContain("max_frequency");
    expect(deploy).toContain("AUTH_COOKIE_SECRET");
  });

  it("DEPLOY.md avisa que o 1000 do config.toml e so para a suite E2E local", () => {
    expect(deploy).toContain("`1000` do `config.toml` são **só para a suíte E2E local**");
  });

  it("os 1000 do config.toml estao comentados como valores so de dev/teste local", () => {
    for (const key of ["email_sent", "sign_in_sign_ups", "token_verifications"]) {
      expect(config, key).toMatch(new RegExp(`${key}\\s*=\\s*1000`));
    }
    expect(config).toMatch(/nunca aplicável em\s+# produção|elevado só para (dev\/teste|dev)/i);
  });
});
