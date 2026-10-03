import { test, expect, type Page } from "@playwright/test";
import { reachRecoverySession, signInThroughForm } from "./helpers/auth";
import { waitForMail } from "./helpers/mailpit";
import { createConfirmedUser, TEST_PASSWORD } from "./helpers/session";

const nova = (page_: Page) => page_.getByLabel("Nova senha", { exact: true });
const confirmar = (page_: Page) => page_.getByLabel("Confirmar nova senha");
const salvar = (page_: Page) => page_.getByRole("button", { name: "Salvar nova senha" });

test.describe("/redefinir-senha (AUTH-14)", () => {
  test("sem sessao volta a /esqueci-senha", async ({ page }) => {
    await page.goto("/redefinir-senha");

    await page.waitForURL("**/esqueci-senha");
  });

  test("com sessao de recuperacao mostra os dois campos, bloqueia senhas diferentes ou fracas", async ({
    page,
  }) => {
    const email = `redef-valida-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "investidor", nome: "Valida" });
    await reachRecoverySession(page, email);

    await expect(nova(page)).toHaveAttribute("autocomplete", "new-password");
    await expect(confirmar(page)).toHaveAttribute("autocomplete", "new-password");

    await nova(page).fill("abc123");
    await expect(page.getByText("Use ao menos 8 caracteres.")).toBeVisible();
    await expect(salvar(page)).toBeDisabled();

    await nova(page).fill("nova-senha-1");
    await confirmar(page).fill("nova-senha-2");
    await expect(page.getByText("As senhas não são iguais.")).toBeVisible();
    await expect(salvar(page)).toBeDisabled();
  });

  test("a mesma senha da atual mostra 'Escolha uma senha diferente da atual.'", async ({ page }) => {
    const email = `redef-igual-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "investidor", nome: "Igual" });
    await reachRecoverySession(page, email);

    await nova(page).fill(TEST_PASSWORD);
    await confirmar(page).fill(TEST_PASSWORD);
    await salvar(page).click();

    await expect(page.getByText("Escolha uma senha diferente da atual.")).toBeVisible();
    expect(new URL(page.url()).pathname).toBe("/redefinir-senha");
  });

  test("senha valida: segue logado ao destino do papel com aviso, entra com a nova e nao com a antiga, e recebe o e-mail de aviso", async ({
    page,
    browser,
    baseURL,
  }) => {
    const email = `redef-ok-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Redefine" });
    await reachRecoverySession(page, email);
    const before = Date.now();

    await nova(page).fill("nova-senha-1");
    await confirmar(page).fill("nova-senha-1");
    await salvar(page).click();

    await page.waitForURL(/\/produtor\?aviso=senha-alterada/);
    expect((await page.context().cookies()).some((c) => c.name === "iasy_recovery")).toBe(false);
    const notice = await waitForMail(email, { after: before, subject: "senha da Îasy foi alterada" });
    expect(notice.HTML).toContain("Se não foi você");

    const fresh = await browser.newContext({ baseURL });
    const freshPage = await fresh.newPage();
    await signInThroughForm(freshPage, email, TEST_PASSWORD);
    await expect(freshPage.getByRole("main").getByRole("alert")).toHaveText("E-mail ou senha incorretos.");
    await signInThroughForm(freshPage, email, "nova-senha-1");
    await freshPage.waitForURL("**/produtor");
    await fresh.close();
  });
});
