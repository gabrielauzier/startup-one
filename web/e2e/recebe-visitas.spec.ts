import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import { createBusiness, createProfileWithAuth } from "./helpers/db";

/**
 * T52: fecha o gap - `recebe_visitas` (capturado no T20, cadastro do
 * produtor) precisa alimentar tanto a etiqueta da página pública do
 * negócio (T40) quanto o filtro "Recebe visitas" dos resultados de
 * descoberta (T36). Um negócio SEM a marcação prova que o filtro
 * exclui de verdade (não é um filtro que sempre deixa tudo passar).
 */
test.describe("Barra 'Recebe visitas' ponta a ponta (T52, RN-25)", () => {
  test("negócio marcado 'recebe visitas' mostra a etiqueta na página e é mantido pelo filtro dos resultados", async ({
    page,
  }) => {
    const ownerId = await createProfileWithAuth("recebe-visitas-owner", "produtor");
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const comVisitaSlug = `negocio-com-visita-${runId}`;
    await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug: comVisitaSlug,
      nome: `Negócio Com Visita ${runId}`,
      status: "verificado",
      recebe_visitas: true,
      produtos: ["Açaí"],
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
    });

    const semVisitaSlug = `negocio-sem-visita-${runId}`;
    await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug: semVisitaSlug,
      nome: `Negócio Sem Visita ${runId}`,
      status: "verificado",
      recebe_visitas: false,
      produtos: ["Açaí"],
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
    });

    // T40: a etiqueta "Recebe visitas" aparece na página pública só
    // para quem foi marcado como tal.
    await page.goto(`/negocios/${comVisitaSlug}`);
    await expect(page.getByText("Recebe visitas")).toBeVisible();

    await page.goto(`/negocios/${semVisitaSlug}`);
    await expect(page.getByText("Recebe visitas")).toHaveCount(0);

    // T36: responde a descoberta (perfil amplo o bastante para os 2
    // negócios passarem do corte de 40%) e aplica o filtro "Recebe
    // visitas" - só o negócio marcado deve sobrar.
    await page.goto("/descobrir/1");
    await page.getByLabel("Equilíbrio").check();
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByLabel("R$ 50 a 200 mil").check();
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByRole("checkbox", { name: "Todos" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByLabel("Até 36 meses").check();
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByRole("button", { name: "Pular esta pergunta" }).click();
    await expect(page).toHaveURL(/\/descobrir\/resultados$/);

    await expect(page.getByText(`Negócio Com Visita ${runId}`)).toBeVisible();
    await expect(page.getByText(`Negócio Sem Visita ${runId}`)).toBeVisible();

    await page.getByRole("link", { name: "Recebe visitas", exact: true }).click();
    await expect(page).toHaveURL(/filtro=recebe_visitas/);

    await expect(page.getByText(`Negócio Com Visita ${runId}`)).toBeVisible();
    await expect(page.getByText(`Negócio Sem Visita ${runId}`)).toHaveCount(0);
  });
});
