import { test, expect } from "@playwright/test";

test.describe("Tela Entrar /entrar", () => {
  test("botão Entrar fica desabilitado sem perfil marcado (CA-01.1)", async ({
    page,
  }) => {
    await page.goto("/entrar");

    const entrarButton = page.getByRole("button", { name: "Entrar" });
    await expect(entrarButton).toBeDisabled();

    await page.getByRole("radio", { name: "Quero investir" }).click();
    await expect(entrarButton).toBeEnabled();
  });

  test("envia o codigo e redireciona para /entrar/codigo", async ({ page }) => {
    await page.goto("/entrar");

    await page.getByRole("radio", { name: "Quero investir" }).click();
    await page.getByLabel("E-mail").fill(`helena-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Entrar" }).click();

    await page.waitForURL(/\/entrar\/codigo\?/);
    expect(page.url()).toContain("role=investidor");
  });
});
