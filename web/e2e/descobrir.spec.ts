import { test, expect } from "@playwright/test";

// RF-17/RN-22: as 5 perguntas da descoberta guiada sao publicas (RN-26)
// - visitante sem conta pode responder (RN-23), entao os testes abaixo
// nao fazem login.

test.describe("Descoberta guiada /descobrir/[n]", () => {
  test("CA-22.1: pergunta 3 sem produto marcado mantém Continuar desabilitado", async ({
    page,
  }) => {
    await page.goto("/descobrir/3");

    await expect(page.getByText("Pergunta 3 de 5")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar" })).toBeDisabled();

    await page.getByRole("checkbox", { name: "Alimentos" }).click();
    await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
  });

  test("CA-22.2: marcar 'Todos' desmarca as demais opções, e vice-versa", async ({ page }) => {
    await page.goto("/descobrir/3");

    const alimentos = page.getByRole("checkbox", { name: "Alimentos" });
    const todos = page.getByRole("checkbox", { name: "Todos" });

    await alimentos.click();
    await page.getByRole("checkbox", { name: "Castanha" }).click();
    await expect(alimentos).toBeChecked();

    await todos.click();
    await expect(todos).toBeChecked();
    await expect(alimentos).not.toBeChecked();

    await alimentos.click();
    await expect(alimentos).toBeChecked();
    await expect(todos).not.toBeChecked();
  });

  test("CA-22.4: Voltar preserva a resposta anterior e mostra 'Pergunta N de 5' correto", async ({
    page,
  }) => {
    await page.goto("/descobrir/1");
    await expect(page.getByText("Pergunta 1 de 5")).toBeVisible();

    await page.getByLabel("Impacto primeiro").check();
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page).toHaveURL(/\/descobrir\/2$/);
    await expect(page.getByText("Pergunta 2 de 5")).toBeVisible();

    await page.getByRole("button", { name: "Voltar" }).click();

    await expect(page).toHaveURL(/\/descobrir\/1$/);
    await expect(page.getByText("Pergunta 1 de 5")).toBeVisible();
    await expect(page.getByLabel("Impacto primeiro")).toBeChecked();
  });

  test("CA-22.3: 'Pular esta pergunta' na 5ª segue para os resultados sem critério de impacto", async ({
    page,
  }) => {
    await page.goto("/descobrir/1");
    await page.getByLabel("Impacto primeiro").check();
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page).toHaveURL(/\/descobrir\/2$/);
    await page.getByLabel("R$ 50 a 200 mil").check();
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page).toHaveURL(/\/descobrir\/3$/);
    await page.getByRole("checkbox", { name: "Todos" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page).toHaveURL(/\/descobrir\/4$/);
    await page.getByLabel("Até 24 meses").check();
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page).toHaveURL(/\/descobrir\/5$/);
    // marca um impacto, mas vai pular mesmo assim (CA-22.3)
    await page.getByRole("checkbox", { name: "Floresta em pé" }).click();
    await page.getByRole("button", { name: "Pular esta pergunta" }).click();

    await expect(page).toHaveURL(/\/descobrir\/resultados$/);
    await expect(page.getByText("Sem critério de impacto (pergunta pulada).")).toBeVisible();
  });
});
