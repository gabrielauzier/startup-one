import { test, expect } from "@playwright/test";
import { addSessionCookies, createConfirmedUser } from "./helpers/session";

test.describe("Aviso 'Defina uma senha' (AUTH-18)", () => {
  test("conta sem has_password ve o aviso uma vez por sessao; dispensar esconde", async ({
    page,
    context,
    baseURL,
  }) => {
    const email = `aviso-senha-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Sem Senha MVP" });
    await addSessionCookies(context, baseURL!, email);

    await page.goto("/negocios");
    const aviso = page.getByRole("region", { name: "Defina uma senha" });
    await expect(aviso).toBeVisible();
    await expect(aviso.getByRole("link", { name: "Definir senha" })).toHaveAttribute(
      "href",
      "/redefinir-senha"
    );

    await aviso.getByRole("button", { name: "Dispensar aviso de senha" }).click();
    await expect(aviso).toHaveCount(0);
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Defina uma senha" })).toHaveCount(0);
  });

  test("quem se cadastrou com senha (has_password) nao ve o aviso", async ({ page, context, baseURL }) => {
    const email = `aviso-senha-ok-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Com Senha", hasPassword: true });
    await addSessionCookies(context, baseURL!, email);

    await page.goto("/negocios");

    await expect(page.getByRole("region", { name: "Defina uma senha" })).toHaveCount(0);
  });
});
