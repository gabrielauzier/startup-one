import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AUTH_EVENT_TYPES } from "../track";

const MIGRATIONS = join(__dirname, "../../../supabase/migrations");

function checkTypes(file: string): string[] {
  const sql = readFileSync(join(MIGRATIONS, file), "utf-8");
  const body = sql.slice(sql.indexOf("check ("));
  return [...body.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
}

describe("tipos de evento de auth (AUTH-15)", () => {
  it("AUTH_EVENT_TYPES tem os 11 tipos da spec", () => {
    expect([...AUTH_EVENT_TYPES].sort()).toEqual(
      [
        "auth_cadastro_enviado",
        "auth_email_confirmado",
        "auth_login_senha_ok",
        "auth_login_senha_erro",
        "auth_magic_link_pedido",
        "auth_magic_link_ok",
        "auth_reset_pedido",
        "auth_reset_codigo_ok",
        "auth_reset_codigo_erro",
        "auth_senha_alterada",
        "auth_logout",
      ].sort()
    );
  });

  it("o CHECK de events.type da migracao 0014 aceita exatamente os tipos de auth do codigo", () => {
    const authInMigration = checkTypes("0014_events_auth_types.sql").filter((t) =>
      t.startsWith("auth_")
    );
    expect(authInMigration.sort()).toEqual([...AUTH_EVENT_TYPES].sort());
  });

  it("a migracao 0014 mantem todos os tipos que a 0011 ja aceitava", () => {
    const before = checkTypes("0011_notification_types_avisos_prazo.sql");
    const after = checkTypes("0014_events_auth_types.sql");
    for (const type of before) {
      expect(after).toContain(type);
    }
  });
});
