import { test, expect } from "@playwright/test";

const API_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const adminHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

async function createUser(email: string, metadata?: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ email, email_confirm: true, user_metadata: metadata }),
  });
  return { status: res.status, body: (await res.json()) as { id?: string } };
}

async function getProfile(id: string) {
  const res = await fetch(`${API_URL}/rest/v1/profiles?id=eq.${id}&select=*`, {
    headers: adminHeaders,
  });
  return (await res.json()) as { id: string; role: string; nome: string }[];
}

async function findUserId(email: string): Promise<string | null> {
  const res = await fetch(`${API_URL}/auth/v1/admin/users?per_page=1000`, {
    headers: adminHeaders,
  });
  const { users } = (await res.json()) as { users: { id: string; email: string }[] };
  return users.find((u) => u.email === email)?.id ?? null;
}

test.describe("trigger de perfil em auth.users (AUTH-11)", () => {
  test("role produtor cria profiles com o nome do metadado", async () => {
    const email = `trg-prod-${Date.now()}@example.com`;
    const { status, body } = await createUser(email, { role: "produtor", nome: "Dona Raimunda" });

    expect(status).toBe(200);
    const profiles = await getProfile(body.id!);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].role).toBe("produtor");
    expect(profiles[0].nome).toBe("Dona Raimunda");
  });

  test("sem nome no metadado usa o prefixo do e-mail", async () => {
    const email = `trg-sem-nome-${Date.now()}@example.com`;
    const { body } = await createUser(email, { role: "investidor" });

    const profiles = await getProfile(body.id!);
    expect(profiles[0].nome).toBe(email.split("@")[0]);
  });

  for (const role of ["verificador", "xyz"]) {
    test(`role=${role} falha o cadastro e nao deixa usuario nem profile`, async () => {
      const email = `trg-bad-${role}-${Date.now()}@example.com`;
      const { status } = await createUser(email, { role });

      expect(status).toBeGreaterThanOrEqual(400);
      expect(await findUserId(email)).toBeNull();
    });
  }

  test("sem role no metadado cria o usuario sem profile", async () => {
    const email = `trg-orfao-${Date.now()}@example.com`;
    const { status, body } = await createUser(email);

    expect(status).toBe(200);
    expect(await getProfile(body.id!)).toHaveLength(0);
  });

  test("anon e authenticated nao executam handle_new_user diretamente", async () => {
    for (const key of [ANON_KEY]) {
      const res = await fetch(`${API_URL}/rest/v1/rpc/handle_new_user`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: "{}",
      });
      expect(res.ok).toBe(false);
    }
  });
});
