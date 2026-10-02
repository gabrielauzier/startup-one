import { test, expect } from "@playwright/test";
import { loginAsProducer } from "./helpers/auth";
import { randomValidCnpj } from "./helpers/cnpj";

// CA-05.3 (Fix 4 da rodada 1 do Verifier): o CNPJ e' reservado ja' na
// Parte 1 (nao so' no envio final), entao um segundo rascunho com o
// mesmo CNPJ e' bloqueado com uma mensagem clara ao tentar avancar -
// nao o erro generico "Não foi possível salvar".
test.describe("CNPJ duplicado entre dois cadastros (CA-05.3)", () => {
  test("segundo produtor com o mesmo CNPJ recebe mensagem clara ao avançar da Parte 1", async ({
    page,
    browser,
  }) => {
    const cnpj = randomValidCnpj();

    // Primeiro produtor reserva o CNPJ ao concluir a Parte 1.
    const firstContext = await browser.newContext();
    const firstPage = await firstContext.newPage();
    await loginAsProducer(firstPage, "cnpj-dup-1");
    await firstPage.getByRole("radio", { name: "Não" }).click();
    await firstPage.getByRole("button", { name: "Começar cadastro" }).click();
    await firstPage.waitForURL("/produtor/cadastro/1");

    await firstPage.getByLabel("Seu nome").fill("Raimunda Souza");
    await firstPage.getByLabel("Telefone com WhatsApp").fill("91999999999");
    await firstPage.getByLabel("CNPJ").fill(cnpj);
    await firstPage.getByRole("checkbox", { name: /Autorizo a Îasy/ }).click();
    await firstPage.getByRole("button", { name: "Continuar" }).click();
    await firstPage.waitForURL("/produtor/cadastro/2");

    // Segundo produtor, rascunho diferente, tenta usar o mesmo CNPJ.
    await loginAsProducer(page, "cnpj-dup-2");
    await page.getByRole("radio", { name: "Não" }).click();
    await page.getByRole("button", { name: "Começar cadastro" }).click();
    await page.waitForURL("/produtor/cadastro/1");

    await page.getByLabel("Seu nome").fill("João Silva");
    await page.getByLabel("Telefone com WhatsApp").fill("91988888888");
    await page.getByLabel("CNPJ").fill(cnpj);
    await page.getByRole("checkbox", { name: /Autorizo a Îasy/ }).click();
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(
      page.getByText(
        "Este CNPJ já está em uso por outro cadastro em andamento ou verificado."
      )
    ).toBeVisible();
    await expect(page).toHaveURL(/\/produtor\/cadastro\/1/);

    await firstContext.close();
  });
});
