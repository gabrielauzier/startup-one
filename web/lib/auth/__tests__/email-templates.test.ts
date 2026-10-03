import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../../../supabase");
const template = (name: string) => readFileSync(join(root, "templates", name), "utf-8");
const config = readFileSync(join(root, "config.toml"), "utf-8");

describe("templates de e-mail de auth (AUTH-06, AUTH-08, AUTH-12, AUTH-14)", () => {
  it("confirmation.html aponta para /auth/confirm com token_hash e type=signup e nao traz o codigo", () => {
    const html = template("confirmation.html");
    expect(html).toContain(
      "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next={{ .RedirectTo }}"
    );
    expect(html).not.toContain("{{ .Token }}");
    expect(html).toContain("10 minutos");
  });

  it("magic_link.html aponta para /auth/confirm com type=email", () => {
    expect(template("magic_link.html")).toContain(
      "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}"
    );
  });

  it("recovery.html mostra o codigo e a validade e nao traz link", () => {
    const html = template("recovery.html");
    expect(html).toContain("{{ .Token }}");
    expect(html).toContain("10 minutos");
    expect(html).not.toContain("{{ .ConfirmationURL }}");
    expect(html).not.toContain("{{ .SiteURL }}");
    expect(html).not.toContain("href");
  });

  it("password_changed.html orienta quem nao fez a alteracao", () => {
    const html = template("password_changed.html");
    expect(html).toContain("Se não foi você");
    expect(html).toContain("Esqueci minha senha");
  });

  it("config.toml registra confirmation, magic_link, recovery e a notificacao de senha alterada", () => {
    for (const [section, file] of [
      ["auth.email.template.confirmation", "confirmation.html"],
      ["auth.email.template.magic_link", "magic_link.html"],
      ["auth.email.template.recovery", "recovery.html"],
      ["auth.email.notification.password_changed", "password_changed.html"],
    ]) {
      const body = config.split(new RegExp(`^\\[${section.replace(/\./g, "\\.")}\\]`, "m"))[1];
      expect(body, section).toBeDefined();
      expect(body.slice(0, body.search(/^\[/m) === -1 ? undefined : body.search(/^\[/m))).toContain(
        `./supabase/templates/${file}`
      );
    }
  });

  it("a notificacao de senha alterada esta habilitada", () => {
    const body = config.split(/^\[auth\.email\.notification\.password_changed\]/m)[1];
    expect(body).toMatch(/^\s*enabled\s*=\s*true/m);
  });
});
