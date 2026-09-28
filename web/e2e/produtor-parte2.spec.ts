import { test, expect } from "@playwright/test";
import { loginAsProducer } from "./helpers/auth";

async function chegarNaParte2(page: import("@playwright/test").Page) {
  await loginAsProducer(page, "parte2");
  await page.getByRole("radio", { name: "Não" }).click();
  await page.getByRole("button", { name: "Começar cadastro" }).click();
  await page.waitForURL("/produtor/cadastro/1");

  await page.getByLabel("Seu nome").fill("Raimunda Souza");
  await page.getByLabel("Telefone com WhatsApp").fill("91999999999");
  await page.getByLabel("CNPJ").fill("11444777000161");
  await page.getByRole("checkbox", { name: /Autorizo a Îasy/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("/produtor/cadastro/2");
}

test.describe("Parte 2 Seu negócio /produtor/cadastro/2 (PRO-03)", () => {
  test("cidade fora da Amazônia Legal mostra o aviso do piloto (CA-05.2)", async ({
    page,
  }) => {
    await chegarNaParte2(page);

    await page.getByLabel("Nome do negócio").fill("Fazenda Teste");
    await page.getByLabel("Tipo de organização").selectOption("cooperativa");
    await page.getByLabel("Cidade").fill("São Paulo");
    await page.getByLabel("Estado (UF)").fill("SP");
    await page.getByLabel("Número de famílias").fill("5");
    await page.getByLabel("Tempo de atividade (anos)").fill("3");
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(
      page.getByText("Por enquanto, o piloto da Îasy atende só negócios na Amazônia Legal.")
    ).toBeVisible();
  });

  test("voltar para a parte 1 e retornar preserva os dados (CA-06.2)", async ({
    page,
  }) => {
    await chegarNaParte2(page);

    await page.getByLabel("Nome do negócio").fill("Cooperativa Teste");
    await page.getByLabel("Tipo de organização").selectOption("cooperativa");
    await page.getByLabel("Cidade").fill("Cametá");
    await page.getByLabel("Estado (UF)").fill("PA");
    await page.getByLabel("Número de famílias").fill("12");
    await page.getByLabel("Tempo de atividade (anos)").fill("4");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("/produtor/cadastro/3");

    await page.goto("/produtor/cadastro/1");
    await expect(page.getByLabel("Seu nome")).toHaveValue("Raimunda Souza");

    await page.goto("/produtor/cadastro/2");
    await expect(page.getByLabel("Nome do negócio")).toHaveValue("Cooperativa Teste");
    await expect(page.getByLabel("Cidade")).toHaveValue("Cametá");
  });
});
