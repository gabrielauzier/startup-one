import { test, expect } from "@playwright/test";
import { loginAsProducer } from "./helpers/auth";
import { randomValidCnpj } from "./helpers/cnpj";
import { getBusinessByOwnerId, getUserIdByEmail } from "./helpers/db";

const API_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

async function getRevisionsForBusiness(businessId: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `${API_URL}/rest/v1/business_revisions?business_id=eq.${businessId}&select=*&order=created_at.desc`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    }
  );
  return (await res.json()) as Record<string, unknown>[];
}

test.describe("Rascunho offline do cadastro (CA-07.1/CA-07.2)", () => {
  test("preenche a Parte 3 com a conexao ja caida, mostra 'Salvo no celular', e sincroniza ao voltar", async ({
    page,
    context,
  }) => {
    const email = await loginAsProducer(page, "offline-sync");
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

    // CA-07.1: a conexao cai ANTES de qualquer preenchimento da Parte 3.
    await context.setOffline(true);

    await page.getByRole("checkbox", { name: "Açaí" }).click();
    await page
      .getByRole("checkbox", { name: "Colhemos sem derrubar a mata" })
      .click();
    await page.getByLabel("Produção mensal aproximada").fill("150");

    // Espera o debounce do autosave local (400ms) persistir no
    // IndexedDB antes de voltar a conexao - senao nao ha nada para
    // sincronizar ainda.
    await page.waitForTimeout(800);

    await expect(page.getByText("Parte 3 de 5")).toBeVisible();
    await expect(page.getByText("Salvo no celular", { exact: true })).toBeVisible();

    // Volta a conexao: o rascunho local deve sincronizar sozinho, sem
    // acao do usuario (CA-07.2), e o indicador volta a "Salvo".
    await context.setOffline(false);

    await expect(page.getByText("Parte 3 de 5")).toBeVisible();
    await expect(page.getByText("Salvo", { exact: true })).toBeVisible({
      timeout: 10000,
    });

    const userId = await getUserIdByEmail(email);
    const business = await getBusinessByOwnerId(userId);
    expect(business).not.toBeNull();

    const revisions = await getRevisionsForBusiness(business!.id as string);
    const parte3Revision = revisions.find(
      (r) => (r.dados as Record<string, unknown>)?.part === 3
    );
    expect(parte3Revision).toBeDefined();
    expect((parte3Revision!.dados as Record<string, unknown>).produtos).toEqual(["Açaí"]);
  });
});
