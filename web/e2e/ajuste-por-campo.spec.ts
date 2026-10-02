import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import {
  createBusiness,
  createBusinessRevision,
  getLatestRevisionForPart,
  getUserIdByEmail,
} from "./helpers/db";
import { loginAsProducer, loginAsVerifier } from "./helpers/auth";

// CA-14.1 (Fix 3 da rodada 1 do Verifier; Fix A da rodada 2): "Ajuste
// solicitado" precisa editar so' os campos marcados pelo verificador,
// cada um com um comentario - nao o formulario inteiro liberado com um
// aviso generico. A rodada 2 achou que a trava usava `disabled`, que
// exclui o campo do POST do form: a correcao nunca conseguia ser
// enviada. Este spec agora tambem submete o formulario (nao so' checa o
// estado travado na tela), que e' exatamente o que faltava para pegar
// esse bug.
test.describe("Ajuste solicitado por campo (CA-14.1)", () => {
  test("verificador marca 'cidade' com um comentário; produtor corrige e consegue avançar (Parte 2)", async ({
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

    // Rascunho completo da Parte 2 ja preenchido antes do pedido de
    // ajuste - sem isso os campos travados (readOnly/disabled) nasceriam
    // vazios e o form nunca conseguiria avancar, por um motivo diferente
    // do bug original (seed do teste, nao o `disabled` do form).
    await createBusinessRevision(businessId, 2, {
      nome: "Cooperativa Raízes",
      tipoOrg: "cooperativa",
      cidade: "Cidade Antiga",
      uf: "PA",
      familias: 12,
      anosAtividade: 8,
      recebeVisitas: true,
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

    // Campos travados: nao aceitam edicao (readOnly ou disabled,
    // dependendo do tipo de controle) - `toBeEditable()` cobre os dois.
    await expect(producerPage.getByLabel("Nome do negócio")).not.toBeEditable();
    await expect(producerPage.getByLabel("Estado (UF)")).not.toBeEditable();
    await expect(producerPage.getByLabel("Número de famílias")).not.toBeEditable();
    await expect(producerPage.getByLabel("Tempo de atividade (anos)")).not.toBeEditable();

    // Gap 1 (rodada 2): o produtor corrige so' o campo liberado e
    // consegue enviar - antes, os campos travados (disabled) saiam do
    // FormData e a Server Action rejeitava por campo obrigatorio vazio
    // (ex.: "Informe o nome do negócio."), mesmo a Cidade estando certa.
    await cidadeInput.fill("Cametá");
    await producerPage.getByRole("button", { name: "Continuar" }).click();
    await producerPage.waitForURL("/produtor/cadastro/3");

    const parte2Revisao = await getLatestRevisionForPart(businessId, 2);
    expect(parte2Revisao?.cidade).toBe("Cametá");
    // Os campos travados mantem o valor original gravado antes do
    // ajuste - nao o que o form tenha postado para eles.
    expect(parte2Revisao?.nome).toBe("Cooperativa Raízes");
    expect(parte2Revisao?.uf).toBe("PA");
    expect(parte2Revisao?.familias).toBe(12);
    expect(parte2Revisao?.anosAtividade).toBe(8);

    // A pagina de revisao tambem resume o pedido com o comentario.
    await producerPage.goto("/produtor/cadastro/revisar");
    await expect(
      producerPage.getByTestId("ajuste-resumo-parte2.cidade")
    ).toContainText(comentario);

    await producerContext.close();
  });

  test("verificador marca 'telefone' (Parte 1) com um comentário; produtor corrige e avança, CNPJ e nome ficam intactos", async ({
    page,
    browser,
  }) => {
    const producerContext = await browser.newContext();
    const producerPage = await producerContext.newPage();
    const producerEmail = await loginAsProducer(producerPage, "ajuste-owner-p1");
    const ownerId = await getUserIdByEmail(producerEmail);
    const cnpj = randomValidCnpj();

    const businessId = await createBusiness(ownerId, {
      status: "em_analise",
      cnpj,
    });

    await createBusinessRevision(businessId, 1, {
      nome: "Raimunda Souza",
      telefone: "9199990000",
      email: "raimunda@example.com",
      cnpj,
      autorizacao: true,
    });

    await loginAsVerifier(page, "ajuste-verif-p1");
    await page.goto(`/verificacao/${businessId}`);
    await page.getByRole("button", { name: "Pedir ajuste" }).click();

    const comentario = "O telefone informado não atende - confirme o número certo.";
    await page.getByTestId("campo-ajuste-parte1.telefone").click();
    await page.getByTestId("comentario-parte1.telefone").fill(comentario);
    await page
      .getByTestId("motivo")
      .fill("So' o telefone precisa ser corrigido, o resto do cadastro está ok.");
    await page.getByTestId("confirmar-decisao").click();
    await page.waitForURL("/verificacao");

    await producerPage.goto("/produtor/cadastro/1");

    const telefoneInput = producerPage.getByLabel("Telefone com WhatsApp");
    await expect(telefoneInput).toBeEnabled();
    await expect(producerPage.getByLabel("Seu nome")).not.toBeEditable();
    await expect(producerPage.getByLabel("CNPJ")).not.toBeEditable();

    await telefoneInput.fill("9199991234");
    await producerPage.getByRole("button", { name: "Continuar" }).click();
    await producerPage.waitForURL("/produtor/cadastro/2");

    const parte1Revisao = await getLatestRevisionForPart(businessId, 1);
    expect(parte1Revisao?.telefone).toBe("9199991234");
    // Campos nao marcados - inclusive o CNPJ, que tem seu proprio
    // caminho de gravacao direto na coluna `businesses.cnpj` - mantem o
    // valor original.
    expect(parte1Revisao?.nome).toBe("Raimunda Souza");
    expect(parte1Revisao?.cnpj).toBe(cnpj);

    await producerContext.close();
  });
});
