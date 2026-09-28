import { test, expect } from "@playwright/test";
import { loginAsProducer } from "./helpers/auth";
import { getUserIdByEmail, getBusinessByOwnerId, createEvidence } from "./helpers/db";
import { randomValidCnpj } from "./helpers/cnpj";

// T59 (RNF-12): fluxo de ponta a ponta do cadastro do produtor - login
// sem senha, as 5 partes, revisão e envio, terminando com o negócio em
// `em_analise`. Um assert por etapa confirma que cada passo realmente
// avançou (não só o resultado final), para pegar quebras de integração
// entre fases que um spec fragmentado por CA isolada não pegaria.
test.describe("Fluxo completo: cadastro do produtor (RNF-12)", () => {
  test("login -> partes 1-5 -> revisar -> enviar -> em_analise", async ({ page }) => {
    // Etapa 1: entrada sem senha (RN-02) como produtor.
    const email = await loginAsProducer(page, "flow-cadastro");
    await expect(page).toHaveURL("/produtor");

    // Etapa 2: boas-vindas -> parte 1 (dados pessoais e do CNPJ).
    await page.getByRole("radio", { name: "Não" }).click();
    await page.getByRole("button", { name: "Começar cadastro" }).click();
    await page.waitForURL("/produtor/cadastro/1");

    await page.getByLabel("Seu nome").fill("Raimunda Souza");
    await page.getByLabel("Telefone com WhatsApp").fill("91999999999");
    await page.getByLabel("CNPJ").fill(randomValidCnpj());
    await page.getByRole("checkbox", { name: /Autorizo a Îasy/ }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("/produtor/cadastro/2");

    // Etapa 3: parte 2 (negócio) -> parte 3 (produção).
    await page.getByLabel("Nome do negócio").fill("Cooperativa Fluxo Completo");
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

    // Etapa 4: parte 4 (evidências) - Storage local desabilitado (T22),
    // as evidências obrigatórias são inseridas direto no banco.
    const userId = await getUserIdByEmail(email);
    let business = await getBusinessByOwnerId(userId);
    expect(business?.status).toBe("rascunho");
    const businessId = business!.id as string;
    await createEvidence(businessId, "onde_produz");
    await createEvidence(businessId, "produto");

    // Etapa 5: parte 5 (valor e retorno) -> revisão.
    await page.goto("/produtor/cadastro/5");
    await page.getByLabel("Finalidade").selectOption("obras");
    await page.locator("#retornoProposto").fill("14,8");
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.waitForURL("/produtor/cadastro/revisar");
    await expect(page.getByRole("heading", { name: "Confira seu cadastro" })).toBeVisible();

    // Etapa 6: envio final -> confirmação -> negócio em_analise.
    await page.getByRole("button", { name: "Enviar para análise" }).click();
    await page.waitForURL("/produtor/cadastro/enviado");
    await expect(page.getByRole("heading", { name: "Recebemos seu cadastro" })).toBeVisible();

    business = await getBusinessByOwnerId(userId);
    expect(business?.status).toBe("em_analise");
    expect(business?.nome).toBe("Cooperativa Fluxo Completo");
    expect(business?.retorno_proposto).toBe(14.8);
  });
});
