import { test, expect } from "@playwright/test";
import { loginAsInvestor } from "./helpers/auth";
import { getInvestorAnswers, getUserIdByEmail } from "./helpers/db";

/**
 * HU-21/RN-23: "Alterar respostas" reabre a pergunta 1 com as
 * respostas atuais marcadas, e salvar substitui as anteriores
 * (CA-23.2). Precisa de um investidor logado com respostas já salvas
 * em `investor_answers` (T32) - completa a descoberta uma vez, depois
 * usa "Alterar respostas" para trocar a prioridade.
 */
test.describe("Alterar respostas (T34, CA-23.2)", () => {
  test("reabre a pergunta 1 com a resposta atual marcada, e a nova resposta substitui a anterior", async ({
    page,
  }) => {
    const email = await loginAsInvestor(page, "alterar-respostas");

    // Primeiro acesso do investidor: sem respostas ainda, cai em /descobrir/1.
    await page.waitForURL("/descobrir/1");

    await page.getByLabel("Impacto primeiro").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/descobrir\/2$/);

    await page.getByLabel("R$ 50 a 200 mil").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/descobrir\/3$/);

    await page.getByRole("checkbox", { name: "Castanha" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/descobrir\/4$/);

    await page.getByLabel("Até 18 meses").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/descobrir\/5$/);

    await page.getByRole("button", { name: "Pular esta pergunta" }).click();
    await expect(page).toHaveURL(/\/descobrir\/resultados$/);

    const userId = await getUserIdByEmail(email);
    const firstAnswers = await getInvestorAnswers(userId);
    expect(firstAnswers?.prioridade).toBe("impacto");

    // CA-23.2: "Alterar respostas" volta à pergunta 1 com a marcação atual.
    await page.getByRole("link", { name: "Alterar respostas" }).click();
    await expect(page).toHaveURL(/\/descobrir\/1$/);
    await expect(page.getByLabel("Impacto primeiro")).toBeChecked();

    await page.getByLabel("Retorno primeiro").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    // As demais respostas seguem marcadas (vieram do rascunho salvo).
    await expect(page).toHaveURL(/\/descobrir\/2$/);
    await expect(page.getByLabel("R$ 50 a 200 mil")).toBeChecked();
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page).toHaveURL(/\/descobrir\/3$/);
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/descobrir\/4$/);
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/descobrir\/5$/);
    await page.getByRole("button", { name: "Pular esta pergunta" }).click();
    await expect(page).toHaveURL(/\/descobrir\/resultados$/);

    // Salvar substitui a anterior - continua havendo uma única linha.
    const updatedAnswers = await getInvestorAnswers(userId);
    expect(updatedAnswers?.prioridade).toBe("retorno");
  });
});
