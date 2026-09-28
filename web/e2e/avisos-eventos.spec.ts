import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import {
  createBusiness,
  createEvidence,
  createProfileWithAuth,
  getEventsByType,
  getUserIdByEmail,
} from "./helpers/db";
import { loginAsInvestor, loginAsProducer, loginAsVerifier } from "./helpers/auth";

/**
 * T54/RF-31: cobre ao menos 2 dos 9 gatilhos de aviso ponta a ponta
 * (interesse recebido e selo concedido, como o "Done when" da task
 * pede), confirmando o registro em `events` via REST com a
 * service-role key - a tabela é interna de operação (sem RLS de
 * leitura para nenhum perfil), então o helper `getEventsByType`
 * consulta direto, mesmo padrão dos demais e2e deste projeto.
 */
test.describe("Avisos enfileirados em events (T53/T54)", () => {
  test("interesse recebido: enfileira o aviso à produtora dona do negócio", async ({ page }) => {
    const ownerId = await createProfileWithAuth("aviso-interesse-owner", "produtor");
    const suffix = Date.now();
    const slug = `negocio-aviso-interesse-${suffix}`;
    await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome: `Negócio Aviso Interesse ${suffix}`,
      status: "verificado",
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
    });

    await loginAsInvestor(page, "aviso-interesse-inv");
    await page.goto(`/negocios/${slug}`);

    await page.getByTestId("botao-tenho-interesse").click();
    await expect(page.getByTestId("interesse-modal")).toBeVisible();
    await page.getByTestId("interesse-valor").fill("5000");
    await page.getByTestId("interesse-confirmacao").click();
    await page.getByTestId("enviar-interesse").click();

    await page.waitForURL(/\/interesse-enviado/);

    const events = await getEventsByType("interesse_recebido", ownerId);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toMatchObject({ destinatario_id: ownerId, kind: "aviso" });
    // RN-41: produtor recebe WhatsApp manual (lista pendente) + e-mail
    // em paralelo - 2 canais para o mesmo tipo de aviso.
    const canais = events.map((e) => e.canal).sort();
    expect(canais).toEqual(["email", "whatsapp_manual"]);
  });

  test("selo concedido: enfileira o aviso à produtora ao aprovar (RF-15/RF-31)", async ({
    page,
  }) => {
    const ownerEmail = await loginAsProducer(page, "aviso-selo-owner");
    const ownerId = await getUserIdByEmail(ownerEmail);
    const businessId = await createBusiness(ownerId);
    await createEvidence(businessId, "terra");

    await loginAsVerifier(page, "aviso-selo-verif");
    await page.goto(`/verificacao/${businessId}`);

    const items = [
      "cnpj_ativo",
      "documento_terra_legivel",
      "fotos_compativeis",
      "producao_coerente",
      "praticas_plausiveis",
    ];
    for (const item of items) {
      await page.getByTestId(`checklist-${item}`).click();
    }
    await page.getByTestId("botao-aprovar").click();

    await page.getByRole("spinbutton").nth(0).fill("90");
    await page.getByRole("spinbutton").nth(1).fill("85");
    await page.getByRole("spinbutton").nth(2).fill("88");
    await page.getByTestId("confirmar-aprovacao").click();

    await page.waitForURL("/verificacao");

    const events = await getEventsByType("selo_concedido", ownerId);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toMatchObject({ destinatario_id: ownerId, kind: "aviso" });
    const canais = events.map((e) => e.canal).sort();
    expect(canais).toEqual(["email", "whatsapp_manual"]);
  });
});
