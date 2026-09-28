import type { Page } from "@playwright/test";
import { getUserIdByEmail, promoteToVerifier } from "./db";

const MAILPIT_URL = "http://127.0.0.1:54324";

async function getOtpCodeFromMailpit(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=to:${encodeURIComponent(email)}`
    );
    const { messages } = (await res.json()) as { messages: { ID: string }[] };

    if (messages.length > 0) {
      const detail = await fetch(`${MAILPIT_URL}/api/v1/message/${messages[0].ID}`);
      const body = (await detail.json()) as { Text: string };
      const match = body.Text.match(/\b\d{6}\b/);
      if (match) return match[0];
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Nenhum código OTP encontrado para ${email} no Mailpit`);
}

/**
 * Loga como produtor via OTP real (Supabase local + Mailpit), reusando
 * o mesmo fluxo de `/entrar` -> `/entrar/codigo` do T8/T9. Devolve o
 * e-mail usado, para os testes poderem consultar o banco pelo dono.
 */
export async function loginAsProducer(page: Page, emailPrefix: string): Promise<string> {
  const email = `${emailPrefix}-${Date.now()}@example.com`;

  await page.goto("/entrar");
  await page.getByRole("radio", { name: "Produzo na Amazônia" }).click();
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/entrar\/codigo\?/);

  const code = await getOtpCodeFromMailpit(email);
  await page.getByLabel("Código de 6 dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar" }).click();
  await page.waitForURL("/produtor");

  return email;
}

/**
 * RN-01: nao existe fluxo de login normal para `verificador` - so' a
 * equipe credencia. Loga como investidor via OTP real e promove via
 * REST/service-role (helpers/db.ts `promoteToVerifier`), simulando esse
 * credenciamento, depois navega para a fila.
 */
export async function loginAsVerifier(page: Page, emailPrefix: string): Promise<string> {
  const email = `${emailPrefix}-${Date.now()}@example.com`;

  await page.goto("/entrar");
  await page.getByRole("radio", { name: "Quero investir" }).click();
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForURL(/\/entrar\/codigo\?/);

  const code = await getOtpCodeFromMailpit(email);
  await page.getByLabel("Código de 6 dígitos").fill(code);
  await page.getByRole("button", { name: "Confirmar" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/entrar"));

  const userId = await getUserIdByEmail(email);
  await promoteToVerifier(userId);

  await page.goto("/verificacao");

  return email;
}
