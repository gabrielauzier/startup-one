import { test, expect } from "@playwright/test";
import { createConfirmedUser, TEST_PASSWORD } from "./helpers/session";
import { randomValidCnpj } from "./helpers/cnpj";
import { createBusiness, createProfileWithAuth, getInterest } from "./helpers/db";
import { loginAsInvestor, loginAsProducer } from "./helpers/auth";

async function createVerifiedBusiness(prefix: string, valorBusca = 100_000): Promise<string> {
  const ownerId = await createProfileWithAuth(prefix, "produtor");
  const suffix = Date.now();
  const slug = `negocio-${prefix}-${suffix}`;
  await createBusiness(ownerId, {
    cnpj: randomValidCnpj(),
    slug,
    nome: `Negócio ${prefix} ${suffix}`,
    status: "verificado",
    valor_busca: valorBusca,
    prazo_meses: 24,
    nota_a: 80,
    nota_s: 80,
    nota_g: 80,
  });
  return slug;
}

test.describe("Formulário Tenho interesse /negocios/[slug] (T46)", () => {
  test("CA-36.3: produtor logado não vê o botão 'Tenho interesse'", async ({ page }) => {
    const slug = await createVerifiedBusiness("interesse-produtor");

    await loginAsProducer(page, "interesse-produtor-login");
    await page.goto(`/negocios/${slug}`);

    await expect(page.getByTestId("botao-tenho-interesse")).toHaveCount(0);
  });

  test("CA-36.2/CA-38.1: valor acima do limite bloqueia, e confirmação desmarcada mantém Enviar desabilitado", async ({
    page,
  }) => {
    const slug = await createVerifiedBusiness("interesse-limites", 50_000);

    await loginAsInvestor(page, "interesse-limites-inv");
    await page.goto(`/negocios/${slug}`);

    await page.getByTestId("botao-tenho-interesse").click();
    await expect(page.getByTestId("interesse-modal")).toBeVisible();

    await page.getByTestId("interesse-valor").fill("60000");
    await expect(page.getByTestId("interesse-valor-erro")).toHaveText(
      "O valor não pode passar do que o negócio busca"
    );
    await expect(page.getByTestId("enviar-interesse")).toBeDisabled();

    await page.getByTestId("interesse-valor").fill("5000");
    await expect(page.getByTestId("interesse-valor-erro")).toHaveCount(0);
    await expect(page.getByTestId("enviar-interesse")).toBeDisabled();

    await page.getByTestId("interesse-confirmacao").click();
    await expect(page.getByTestId("enviar-interesse")).toBeEnabled();
  });

  test("CA-36.1/CA-38.2/CA-37.1: visitante sem sessão é levado a Entrar e volta ao formulário; interesse enviado grava confirmação e vira 'Ver meu interesse'", async ({
    page,
  }) => {
    const slug = await createVerifiedBusiness("interesse-fluxo");

    // Visitante sem sessão: o botão é um link para /entrar com
    // redirect de volta a este negócio + interesse=1 (CA-36.1).
    await page.goto(`/negocios/${slug}`);
    const expectedHref = `/entrar?redirect=${encodeURIComponent(`/negocios/${slug}?interesse=1`)}`;
    await expect(page.getByTestId("botao-tenho-interesse")).toHaveAttribute("href", expectedHref);
    await page.getByTestId("botao-tenho-interesse").click();

    // Entra como investidor (senha + aceite de termos, primeiro acesso).
    const email = `interesse-fluxo-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "investidor", nome: "Investidor Interesse" });
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();

    // RN-03: novo investidor passa pelos Termos antes de voltar ao
    // destino original - o redirect sobrevive a essa etapa também.
    await page.waitForURL(/\/termos/);
    await page.getByRole("button", { name: "Aceitar e continuar" }).click();

    // Volta para a página do negócio com o modal já aberto (CA-36.1).
    await page.waitForURL(new RegExp(`/negocios/${slug}\\?interesse=1`));
    await expect(page.getByTestId("interesse-modal")).toBeVisible();

    await page.getByTestId("interesse-valor").fill("5000");
    await page.getByTestId("interesse-mensagem").fill("Quero conhecer melhor o negócio.");
    await page.getByTestId("interesse-confirmacao").click();
    await page.getByTestId("enviar-interesse").click();

    await page.waitForURL(/\/interesse-enviado/);
    await expect(page.getByRole("heading", { name: "Interesse enviado" })).toBeVisible();
    await expect(page.getByText(/R\$\s?5\.000/)).toBeVisible();
    await expect(
      page.getByText("Entendo que estou demonstrando interesse, e não investindo agora")
    ).toBeVisible();
    await expect(page.getByTestId("timeline-interesse")).toBeVisible();

    // CA-38.2: confirmação e horário ficam gravados no banco.
    const idMatch = page.url().match(/[?&]id=([^&]+)/);
    expect(idMatch).not.toBeNull();
    const interest = await getInterest(idMatch![1]);
    expect(interest?.confirmacao_texto).toBe(
      "Entendo que estou demonstrando interesse, e não investindo agora"
    );
    expect(interest?.confirmado_em).not.toBeNull();

    // CA-37.1: enquanto Pendente, a página do negócio mostra "Ver meu
    // interesse" em vez do botão de novo.
    await page.goto(`/negocios/${slug}`);
    await expect(page.getByTestId("ver-meu-interesse")).toBeVisible();
    await expect(page.getByTestId("botao-tenho-interesse")).toHaveCount(0);
  });
});
