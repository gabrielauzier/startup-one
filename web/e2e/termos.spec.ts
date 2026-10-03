import { test, expect, type Page } from "@playwright/test";
import { signInThroughForm } from "./helpers/auth";
import { createConfirmedUser } from "./helpers/session";

const API_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

async function getTermosAceitosEm(email: string): Promise<string | null> {
  // O GoTrue local ignora o filtro `email=` (sempre devolve a 1a pagina,
  // sem filtrar) - mesmo bug real documentado no Status do T24 em
  // tasks.md. Pede uma pagina grande e filtra aqui, em vez de confiar
  // em `users[0]`.
  const usersRes = await fetch(`${API_URL}/auth/v1/admin/users?per_page=1000`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  });
  const { users } = (await usersRes.json()) as { users: { id: string; email: string }[] };
  const match = users.find((u) => u.email === email);
  if (!match) throw new Error(`Usuário ${email} não encontrado`);

  const profileRes = await fetch(
    `${API_URL}/rest/v1/profiles?id=eq.${match.id}&select=termos_aceitos_em`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  const rows = (await profileRes.json()) as { termos_aceitos_em: string | null }[];
  return rows[0]?.termos_aceitos_em ?? null;
}

async function loginAsInvestidor(page: Page, email: string) {
  await createConfirmedUser(email, { role: "investidor", nome: "Investidor Termos" });
  await signInThroughForm(page, email);
}

test.describe("Termos de Uso e Política de Privacidade /termos", () => {
  test("investidor sem aceite é redirecionado a /termos no primeiro acesso, e o aceite fica gravado no profile (CA-03.2)", async ({
    page,
  }) => {
    const email = `termos-${Date.now()}@example.com`;

    await loginAsInvestidor(page, email);

    // RF-04: primeiro acesso do investidor exige aceite antes de qualquer
    // outra rota.
    await page.waitForURL(/\/termos/);
    await expect(
      page.getByRole("heading", { name: "Termos de Uso e Política de Privacidade" })
    ).toBeVisible();

    expect(await getTermosAceitosEm(email)).toBeNull();

    await page.getByRole("button", { name: "Aceitar e continuar" }).click();

    // Sem respostas de descoberta ainda, o destino padrao do investidor.
    await page.waitForURL("/descobrir/1");

    // CA-03.2: termos_aceitos_em (e a versao) ficam gravados no profile.
    expect(await getTermosAceitosEm(email)).not.toBeNull();
  });
});
