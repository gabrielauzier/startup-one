import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import { createBusiness, createProfileWithAuth } from "./helpers/db";

// T59 (RNF-12): fluxo de ponta a ponta de descoberta+vitrine - um
// visitante sem conta responde as 5 perguntas da descoberta guiada
// (RN-22/RN-23, pública), vê o negócio alinhado nos resultados
// (RN-24), e o encontra de novo pela busca livre da vitrine pública
// (RN-27), terminando na página completa do negócio (M5). Fecha o laço
// entre M4 (descoberta) e M5 (página do negócio) num teste só.
test.describe("Fluxo completo: descoberta e vitrine (RNF-12)", () => {
  test("responde as 5 perguntas -> vê o negócio nos resultados -> encontra na vitrine -> abre a página", async ({
    page,
  }) => {
    // Etapa 1: negócio verificado, alinhado ao perfil que será
    // respondido a seguir (produtos "Todos" cobre qualquer produto,
    // faixa 50-200 mil e prazo até 24 meses - mesmos critérios usados
    // em descobrir-resultados.spec.ts para garantir alinhamento >= 40%).
    const ownerId = await createProfileWithAuth("flow-vitrine-owner", "produtor");
    const suffix = Date.now();
    const slug = `negocio-flow-vitrine-${suffix}`;
    const nome = `Negócio Fluxo Vitrine ${suffix}`;
    await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug,
      nome,
      status: "verificado",
      cidade_ibge: "Cametá",
      uf: "PA",
      produtos: ["Açaí"],
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
      recebe_visitas: false,
    });

    // Etapa 2: visitante sem conta responde as 5 perguntas (RN-23).
    await page.goto("/descobrir/1");
    await page.getByLabel("Impacto primeiro").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/descobrir\/2$/);

    await page.getByLabel("R$ 50 a 200 mil").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/descobrir\/3$/);

    await page.getByRole("checkbox", { name: "Todos" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/descobrir\/4$/);

    await page.getByLabel("Até 24 meses").check();
    await page.getByRole("button", { name: "Continuar" }).click();
    await expect(page).toHaveURL(/\/descobrir\/5$/);

    await page.getByRole("button", { name: "Pular esta pergunta" }).click();
    await expect(page).toHaveURL(/\/descobrir\/resultados$/);

    // Etapa 3: o negócio alinhado aparece nos resultados.
    await expect(page.getByRole("heading", { name: nome })).toBeVisible();

    // Etapa 4: o mesmo negócio é encontrável pela busca livre da
    // vitrine pública, ignorando acento/maiúsculas (RN-27).
    await page.goto(`/negocios?q=${encodeURIComponent("FLUXO VITRINE")}`);
    await expect(page.getByRole("heading", { name: nome })).toBeVisible();

    // Etapa 5: abrir o card leva à página completa do negócio (M5).
    await page.getByRole("heading", { name: nome }).click();
    await page.waitForURL(`/negocios/${slug}`);
    await expect(page.getByRole("heading", { name: nome, level: 1 })).toBeVisible();
  });
});
