import { test, expect } from "@playwright/test";
import { loginAsProducer } from "./helpers/auth";
import { getUserIdByEmail, getBusinessByOwnerId, createEvidence } from "./helpers/db";
import { randomValidCnpj } from "./helpers/cnpj";

test.describe("Cadastro completo do produtor (T24, PRO-07/PRO-08)", () => {
  test("parte 1 a 5, revisar e enviar - cadastro chega em em_analise", async ({
    page,
  }) => {
    const email = await loginAsProducer(page, "cadastro-completo");

    await page.getByRole("radio", { name: "Não" }).click();
    await page.getByRole("button", { name: "Começar cadastro" }).click();
    await page.waitForURL("/produtor/cadastro/1");

    await page.getByLabel("Seu nome").fill("Raimunda Souza");
    await page.getByLabel("Telefone com WhatsApp").fill("91999999999");
    await page.getByLabel("CNPJ").fill(randomValidCnpj());
    await page.getByRole("checkbox", { name: /Autorizo a Îasy/ }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("/produtor/cadastro/2");

    await page.getByLabel("Nome do negócio").fill("Cooperativa Teste E2E");
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

    // Storage local desabilitado (ver Status do T22) - simula o upload
    // ja concluido inserindo as evidencias obrigatorias direto no banco.
    const userId = await getUserIdByEmail(email);
    const business = await getBusinessByOwnerId(userId);
    const businessId = business!.id as string;
    await createEvidence(businessId, "onde_produz");
    await createEvidence(businessId, "produto");

    await page.goto("/produtor/cadastro/5");
    await page.getByLabel("Finalidade").selectOption("obras");
    await page.locator("#retornoProposto").fill("14,8");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("/produtor/cadastro/revisar");

    await expect(page.getByRole("heading", { name: "Confira seu cadastro" })).toBeVisible();
    await page.getByRole("button", { name: "Enviar para análise" }).click();
    await page.waitForURL("/produtor/cadastro/enviado");

    await expect(page.getByRole("heading", { name: "Recebemos seu cadastro" })).toBeVisible();

    const finalBusiness = await getBusinessByOwnerId(userId);
    expect(finalBusiness?.status).toBe("em_analise");
    expect(finalBusiness?.nome).toBe("Cooperativa Teste E2E");
    expect(finalBusiness?.retorno_proposto).toBe(14.8);
  });
});
