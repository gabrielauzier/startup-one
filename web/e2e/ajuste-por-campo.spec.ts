import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import { createBusiness, getUserIdByEmail } from "./helpers/db";
import { loginAsProducer, loginAsVerifier } from "./helpers/auth";

// CA-14.1 (Fix 3 da rodada 1 do Verifier): "Ajuste solicitado" precisa
// editar so' os campos marcados pelo verificador, cada um com um
// comentario - nao o formulario inteiro liberado com um aviso
// generico.
test.describe("Ajuste solicitado por campo (CA-14.1)", () => {
  test("verificador marca 'cidade' com um comentário; produtor vê só cidade editável, com o comentário", async ({
    page,
    browser,
  }) => {
    const producerContext = await browser.newContext();
    const producerPage = await producerContext.newPage();
    const producerEmail = await loginAsProducer(producerPage, "ajuste-owner");
    const ownerId = await getUserIdByEmail(producerEmail);

    const businessId = await createBusiness(ownerId, {
      status: "em_analise",
      cnpj: randomValidCnpj(),
    });

    await loginAsVerifier(page, "ajuste-verif");
    await page.goto(`/verificacao/${businessId}`);

    await page.getByRole("button", { name: "Pedir ajuste" }).click();

    const comentario = "A cidade informada não bate com o CEP do documento da terra.";
    await page.getByTestId("campo-ajuste-parte2.cidade").click();
    await page.getByTestId("comentario-parte2.cidade").fill(comentario);

    await page
      .getByTestId("motivo")
      .fill("Só a cidade precisa ser corrigida, o resto do cadastro está ok.");
    await page.getByTestId("confirmar-decisao").click();
    await page.waitForURL("/verificacao");

    // Produtor reabre o cadastro: so' "Cidade" (Parte 2) fica editável,
    // com o comentário do verificador ao lado; os demais campos da
    // mesma parte ficam bloqueados.
    await producerPage.goto("/produtor/cadastro/2");

    const cidadeInput = producerPage.getByLabel("Cidade");
    await expect(cidadeInput).toBeEnabled();
    await expect(
      producerPage.getByTestId("ajuste-comentario-cidade")
    ).toHaveText(`Comentário do verificador: ${comentario}`);

    await expect(producerPage.getByLabel("Nome do negócio")).toBeDisabled();
    await expect(producerPage.getByLabel("Estado (UF)")).toBeDisabled();
    await expect(producerPage.getByLabel("Número de famílias")).toBeDisabled();
    await expect(producerPage.getByLabel("Tempo de atividade (anos)")).toBeDisabled();

    // A pagina de revisao tambem resume o pedido com o comentario.
    await producerPage.goto("/produtor/cadastro/revisar");
    await expect(
      producerPage.getByTestId("ajuste-resumo-parte2.cidade")
    ).toContainText(comentario);

    await producerContext.close();
  });
});
