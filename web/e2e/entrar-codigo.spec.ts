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

test.describe("Tela Código de acesso /entrar/codigo", () => {
  test("codigo errado 5 vezes exige um novo codigo (CA-02.1)", async ({ page }) => {
    const email = `codigo-errado-${Date.now()}@example.com`;

    await page.goto("/entrar");
    await page.getByRole("radio", { name: "Quero investir" }).click();
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL(/\/entrar\/codigo\?/);

    const codeInput = page.getByLabel("Código de 6 dígitos");
    const confirmar = page.getByRole("button", { name: "Confirmar" });
    const form = page.locator("form[data-attempts]");

    for (let i = 1; i <= 5; i += 1) {
      await codeInput.fill("000000");
      await confirmar.click();
      // Espera o round-trip do Server Action terminar antes de seguir para a
      // proxima tentativa - o texto de erro nao muda entre tentativas, so' o
      // atributo data-attempts prova que o estado avancou de fato.
      await expect(form).toHaveAttribute("data-attempts", String(i), {
        timeout: 10000,
      });
      await expect(page.getByText("Código inválido ou vencido.")).toBeVisible();
    }

    // Apos a 5a tentativa errada, o formulario trava sem esperar uma 6a
    // submissao (o servidor so' bloquearia explicitamente numa 6a chamada).
    await expect(codeInput).toBeDisabled();
    await expect(confirmar).toBeDisabled();
  });

  test("confirma o codigo e cria a conta com o papel escolhido (CA-02.2)", async ({
    page,
  }) => {
    const email = `codigo-certo-${Date.now()}@example.com`;

    await page.goto("/entrar");
    await page.getByRole("radio", { name: "Produzo na Amazônia" }).click();
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Entrar" }).click();
    await page.waitForURL(/\/entrar\/codigo\?/);

    const code = await getOtpCodeFromMailpit(email);

    await page.getByLabel("Código de 6 dígitos").fill(code);
    await page.getByRole("button", { name: "Confirmar" }).click();

    await page.waitForURL("/");
  });
});
