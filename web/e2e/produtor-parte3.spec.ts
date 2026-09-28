import { test, expect } from "@playwright/test";
import { loginAsProducer } from "./helpers/auth";

async function chegarNaParte3(page: import("@playwright/test").Page) {
  await loginAsProducer(page, "parte3");
  await page.getByRole("radio", { name: "Não" }).click();
  await page.getByRole("button", { name: "Começar cadastro" }).click();
  await page.waitForURL("/produtor/cadastro/1");

  await page.getByLabel("Seu nome").fill("Raimunda Souza");
  await page.getByLabel("Telefone com WhatsApp").fill("91999999999");
  await page.getByLabel("CNPJ").fill("11444777000161");
  await page.getByRole("checkbox", { name: /Autorizo a Îasy/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("/produtor/cadastro/2");

  await page.getByLabel("Nome do negócio").fill("Cooperativa Teste");
  await page.getByLabel("Tipo de organização").selectOption("cooperativa");
  await page.getByLabel("Cidade").fill("Cametá");
  await page.getByLabel("Estado (UF)").fill("PA");
  await page.getByLabel("Número de famílias").fill("12");
  await page.getByLabel("Tempo de atividade (anos)").fill("4");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("/produtor/cadastro/3");
}

test.describe("Parte 3 Sua produção /produtor/cadastro/3 (PRO-04)", () => {
  test("producao mensal zero, negativa ou nao numerica e rejeitada (CA-06.3)", async ({
    page,
  }) => {
    await chegarNaParte3(page);

    await page.getByRole("checkbox", { name: "Açaí" }).click();
    await page.getByRole("checkbox", { name: "Colhemos sem derrubar a mata" }).click();

    await page.getByLabel("Produção mensal aproximada (kg)").fill("0");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(
      page.getByText("Informe a produção mensal (maior que zero).")
    ).toBeVisible();
    await expect(page).toHaveURL(/\/produtor\/cadastro\/3/);

    await page.getByLabel("Produção mensal aproximada (kg)").fill("-5");
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(
      page.getByText("Informe a produção mensal (maior que zero).")
    ).toBeVisible();
  });

  test("exige ao menos 1 produto e 1 pratica para avancar", async ({ page }) => {
    await chegarNaParte3(page);

    await page.getByLabel("Produção mensal aproximada (kg)").fill("120");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText("Escolha ao menos 1 produto.")).toBeVisible();

    await page.getByRole("checkbox", { name: "Açaí" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page.getByText("Marque ao menos 1 prática.")).toBeVisible();

    await page.getByRole("checkbox", { name: "Reflorestamento" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("/produtor/cadastro/4");
  });
});
