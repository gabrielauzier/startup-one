import { test, expect } from "@playwright/test";

const MAILPIT_URL = "http://127.0.0.1:54324";

async function getOtpCodeFromMailpit(email: string): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
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

test.describe("Service worker do cadastro do produtor (RNF-01)", () => {
  test("/produtor/cadastro/1 continua carregando o shell sem internet, depois de uma visita online", async ({
    page,
    context,
  }) => {
    const email = `sw-cadastro-${Date.now()}@example.com`;

    await page.goto("/entrar");
    await page.getByRole("radio", { name: "Produzo na Amazônia" }).click();
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL(/\/entrar\/codigo\?/);

    const code = await getOtpCodeFromMailpit(email);
    await page.getByLabel("Código de 6 dígitos").fill(code);
    await page.getByRole("button", { name: "Confirmar" }).click();
    await page.waitForURL("/produtor");

    await page.goto("/produtor/cadastro/1");
    await expect(
      page.getByRole("heading", { name: "Sobre você" })
    ).toBeVisible();

    // Espera o service worker terminar de instalar e ativar (o "install"
    // ja' deixa o shell em cache) antes de simular a queda de internet.
    await page.evaluate(() => navigator.serviceWorker.ready);

    await context.setOffline(true);
    await page.reload();

    await expect(
      page.getByRole("heading", { name: "Sobre você" })
    ).toBeVisible();
    await expect(page.getByText("Parte 1 de 5 · Salvo")).toBeVisible();

    await context.setOffline(false);
  });
});
