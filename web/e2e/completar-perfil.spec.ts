import { test, expect } from "@playwright/test";
import { createConfirmedUser, addSessionCookies } from "./helpers/session";
import { getProfileByUserId } from "./helpers/db";

test.describe("Complete seu perfil (AUTH-11)", () => {
  test("usuario sem role no metadado cai em /completar-perfil e, apos enviar, chega ao destino do papel", async ({
    page,
    context,
    baseURL,
  }) => {
    const email = `orfao-${Date.now()}@example.com`;
    const userId = await createConfirmedUser(email);
    await addSessionCookies(context, baseURL!, email);

    await page.goto("/produtor/painel");
    await page.waitForURL("**/completar-perfil");

    await page.getByRole("radio", { name: "Produzo na Amazônia" }).click();
    await page.getByLabel("Nome").fill("Raimunda Teste");
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.waitForURL("**/produtor");
    const profile = await getProfileByUserId(userId);
    expect(profile).toMatchObject({ role: "produtor", nome: "Raimunda Teste" });
  });

  test("usuario com perfil que abre /completar-perfil e redirecionado ao destino do papel", async ({
    page,
    context,
    baseURL,
  }) => {
    const email = `comperfil-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Com Perfil" });
    await addSessionCookies(context, baseURL!, email);

    await page.goto("/completar-perfil");

    await page.waitForURL("**/produtor");
  });
});
