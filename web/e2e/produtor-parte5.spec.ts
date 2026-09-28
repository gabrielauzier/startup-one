import { test, expect } from "@playwright/test";
import { loginAsProducer } from "./helpers/auth";

async function chegarNaParte5(page: import("@playwright/test").Page) {
  await loginAsProducer(page, "parte5");
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

  await page.getByRole("checkbox", { name: "Açaí" }).click();
  await page.getByLabel("Produção mensal aproximada (kg)").fill("120");
  await page.getByRole("checkbox", { name: "Reflorestamento" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("/produtor/cadastro/4");

  await page.goto("/produtor/cadastro/5");
}

test.describe("Parte 5 Quanto vocês precisam /produtor/cadastro/5 (PRO-06)", () => {
  test("mostra os limites do valor e a explicação do retorno (RN-10, CA-10.3)", async ({
    page,
  }) => {
    await chegarNaParte5(page);

    await expect(
      page.getByText("De R$ 50.000,00 a R$ 200.000,00, em passos de R$ 5.000,00")
    ).toBeVisible();

    await page.getByRole("button", { name: "O que é o retorno?" }).click();
    await expect(
      page.getByText("É uma proposta: o valor final é definido com o parceiro financeiro.")
    ).toBeVisible();

    await expect(
      page.getByText("A Îasy não recebe nem movimenta dinheiro.")
    ).toBeVisible();
  });

  test("retorno \"14,8\" e persistido e formatado no preview (CA-10.2)", async ({
    page,
  }) => {
    await chegarNaParte5(page);

    await page.getByLabel("Finalidade").selectOption("obras");
    await page.locator("#retornoProposto").fill("14,8");

    await expect(page.getByText("Retorno proposto 14,8% ao ano")).toBeVisible();

    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("/produtor/cadastro/revisar");
  });
});
