import { test, expect } from "@playwright/test";
import { loginAsProducer } from "./helpers/auth";
import { randomValidCnpj } from "./helpers/cnpj";

test.describe("Parte 4 Fotos e documentos /produtor/cadastro/4 (PRO-05) - smoke", () => {
  test("grupo obrigatório vazio bloqueia o avanço (CA-08.1)", async ({ page }) => {
    await loginAsProducer(page, "parte4");
    await page.getByRole("radio", { name: "Não" }).click();
    await page.getByRole("button", { name: "Começar cadastro" }).click();
    await page.waitForURL("/produtor/cadastro/1");

    await page.getByLabel("Seu nome").fill("Raimunda Souza");
    await page.getByLabel("Telefone com WhatsApp").fill("91999999999");
    await page.getByLabel("CNPJ").fill(randomValidCnpj());
    await page.getByRole("checkbox", { name: /Autorizo a Îasy/ }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("/produtor/cadastro/2");

    await page.getByLabel("Nome do negócio").fill("Cooperativa Teste");
    await page.getByRole("radio", { name: "Cooperativa" }).click();
    await page.getByLabel("Cidade").fill("Cametá");
    await page.getByLabel("Estado (UF)").selectOption("PA");
    await page.getByLabel("Número de famílias").fill("12");
    await page.getByLabel("Tempo de atividade (anos)").fill("4");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("/produtor/cadastro/3");

    await page.getByRole("checkbox", { name: "Açaí" }).click();
    await page.getByLabel("Produção mensal aproximada").fill("120");
    await page.getByRole("checkbox", { name: "Reflorestamento" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("/produtor/cadastro/4");

    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(
      page.getByText("Envie ao menos 1 foto de onde vocês produzem.")
    ).toBeVisible();
    await expect(page).toHaveURL(/\/produtor\/cadastro\/4/);
  });
});
