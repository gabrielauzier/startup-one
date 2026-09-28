import { test, expect } from "@playwright/test";
import { loginAsProducer } from "./helpers/auth";
import { getUserIdByEmail, getBusinessByOwnerId, createPartner } from "./helpers/db";

test.describe("Boas-vindas do produtor /produtor (PRO-01)", () => {
  test("\"Sim\" sem parceiro escolhido destaca o campo \"Qual?\" (CA-11.1)", async ({
    page,
  }) => {
    await createPartner(`Cooperativa Teste ${Date.now()}`);
    await loginAsProducer(page, "boasvindas-destaque");

    await page.getByRole("radio", { name: "Sim" }).click();
    await page.getByRole("button", { name: "Começar cadastro" }).click();

    await expect(page.getByText("Escolha qual cooperativa ou ONG indicou você.")).toBeVisible();
    await expect(page.getByLabel("Qual?")).toBeVisible();
  });

  test("\"Começar cadastro\" cria o negócio em rascunho e leva à parte 1", async ({
    page,
  }) => {
    const email = await loginAsProducer(page, "boasvindas-criar");

    await page.getByRole("radio", { name: "Não" }).click();
    await page.getByRole("button", { name: "Começar cadastro" }).click();

    await page.waitForURL("/produtor/cadastro/1");

    const userId = await getUserIdByEmail(email);
    const business = await getBusinessByOwnerId(userId);
    expect(business).not.toBeNull();
    expect(business?.status).toBe("rascunho");
  });
});
