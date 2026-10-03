import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { reachRecoverySession } from "./helpers/auth";
import { createConfirmedUser } from "./helpers/session";

// AUTH-05 (critérios 6 e 14), RNF-07: WCAG 2.1 AA nas telas de auth.
// Falha com violacao `critical` ou `serious` (mesmo criterio de a11y-investor.spec.ts).
async function expectNoCriticalViolations(page: Page) {
  // O <title> chega por streaming depois da navegacao da server action.
  await expect(page).toHaveTitle(/.+/);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious"
  );
  if (serious.length > 0) {
    console.log(
      "Violações críticas/sérias:",
      JSON.stringify(serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target) })), null, 2)
    );
  }
  expect(serious).toEqual([]);
}

/** Tab ate o elemento com `id` receber foco (no maximo 20 passos). */
async function tabTo(page: Page, id: string) {
  for (let i = 0; i < 20; i += 1) {
    await page.keyboard.press("Tab");
    if ((await page.evaluate(() => document.activeElement?.id)) === id) return;
  }
  throw new Error(`Foco nunca chegou em #${id} por teclado`);
}

test.describe("Acessibilidade das telas de auth (AUTH-05)", () => {
  test("/entrar sem violacoes, com erro anunciado e navegacao completa por teclado", async ({ page }) => {
    await page.goto("/entrar");
    await expectNoCriticalViolations(page);

    // rotulos associados
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();

    // teclado: e-mail -> senha -> (Mostrar) -> Entrar, e envio com Enter
    await page.getByLabel("E-mail").focus();
    await page.keyboard.type("a11y@example.com");
    await tabTo(page, "entrar-senha");
    await page.keyboard.type("errada-123");
    await page.keyboard.press("Enter");

    const alert = page.getByRole("main").getByRole("alert");
    await expect(alert).toHaveText("E-mail ou senha incorretos.");
    await expect(page.getByLabel("Senha")).toHaveAttribute("aria-invalid", "true");
    await expectNoCriticalViolations(page);
  });

  test("/cadastro sem violacoes e com aria-invalid na senha fraca", async ({ page }) => {
    await page.goto("/cadastro?perfil=investidor");
    await expectNoCriticalViolations(page);

    await page.getByLabel("Senha", { exact: true }).fill("abc");
    await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expectNoCriticalViolations(page);
  });

  test("/esqueci-senha sem violacoes", async ({ page }) => {
    await page.goto("/esqueci-senha");
    await expectNoCriticalViolations(page);
  });

  test("/esqueci-senha/codigo sem violacoes", async ({ page }) => {
    const email = `a11y-codigo-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "investidor", nome: "A11y" });
    await page.goto("/esqueci-senha");
    await page.getByLabel("E-mail").fill(email);
    await page.getByRole("button", { name: "Enviar código" }).click();
    await page.waitForURL("**/esqueci-senha/codigo");

    await expectNoCriticalViolations(page);
    await expect(page.getByLabel("Código de 6 dígitos")).toBeVisible();
  });

  test("/redefinir-senha sem violacoes", async ({ page }) => {
    const email = `a11y-redef-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "investidor", nome: "A11y" });
    await reachRecoverySession(page, email);

    await expectNoCriticalViolations(page);
    await expect(page.getByLabel("Nova senha", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Confirmar nova senha")).toBeVisible();
  });
});
