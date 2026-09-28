import { test, expect } from "@playwright/test";
import { loginAsProducer } from "./helpers/auth";

test.describe("Parte 1 Sobre você /produtor/cadastro/1 (PRO-02) - smoke", () => {
  test("preenche e avança para a parte 2 com CNPJ valido", async ({ page }) => {
    await loginAsProducer(page, "parte1-smoke");
    await page.getByRole("radio", { name: "Não" }).click();
    await page.getByRole("button", { name: "Começar cadastro" }).click();
    await page.waitForURL("/produtor/cadastro/1");

    await page.getByLabel("Seu nome").fill("Raimunda Souza");
    await page.getByLabel("Telefone com WhatsApp").fill("91999999999");
    await page.getByLabel("CNPJ").fill("11444777000161");
    await page.getByRole("checkbox", { name: /Autorizo a Îasy/ }).click();
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.waitForURL("/produtor/cadastro/2");
  });
});
