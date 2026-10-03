import { test, expect } from "@playwright/test";
import { loginAsProducer } from "./helpers/auth";


test.describe("Service worker do cadastro do produtor (RNF-01)", () => {
  test("/produtor/cadastro/1 continua carregando o shell sem internet, depois de uma visita online", async ({
    page,
    context,
  }) => {
    await loginAsProducer(page, "sw-cadastro");

    // T18: a Parte 1 agora exige um negocio em rascunho (criado nas
    // boas-vindas) antes de aceitar a visita - sem isso, redireciona de
    // volta para /produtor.
    await page.getByRole("radio", { name: "Não" }).click();
    await page.getByRole("button", { name: "Começar cadastro" }).click();
    await page.waitForURL("/produtor/cadastro/1");
    await expect(
      page.getByRole("heading", { name: "Sobre você" })
    ).toBeVisible();

    // Espera o service worker terminar de instalar e ativar (o "install"
    // ja' deixa o shell em cache) antes de simular a queda de internet.
    // `serviceWorker.ready` so' resolve a partir da 2a navegacao sob o
    // escopo controlado; como este e' o primeiro carregamento desta
    // sessao, fazemos poll do registro em vez de depender de `ready`.
    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const reg = await navigator.serviceWorker.getRegistration(
              "/produtor/cadastro/"
            );
            return !!reg?.active;
          }),
        { timeout: 10000 }
      )
      .toBe(true);

    await context.setOffline(true);
    await page.reload();

    await expect(
      page.getByRole("heading", { name: "Sobre você" })
    ).toBeVisible();
    await expect(page.getByText("Parte 1 de 5")).toBeVisible();
    // Offline: o status inicial e' "Salvo no celular" (useDraftSync
    // detecta `navigator.onLine === false` já no primeiro render).
    await expect(page.getByText("Salvo no celular", { exact: true })).toBeVisible();

    await context.setOffline(false);
  });
});
