import { test, expect } from "@playwright/test";

const API_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

async function insertEvent(type: string) {
  return fetch(`${API_URL}/rest/v1/events`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ kind: "produto", type, payload: {} }),
  });
}

test.describe("CHECK de events.type (AUTH-15)", () => {
  test("aceita um tipo auth_ novo e continua aceitando um tipo antigo", async () => {
    expect((await insertEvent("auth_login_senha_ok")).status).toBe(201);
    expect((await insertEvent("cadastro_enviado")).status).toBe(201);
  });

  test("rejeita tipo inexistente", async () => {
    expect((await insertEvent("auth_inexistente")).ok).toBe(false);
  });
});
