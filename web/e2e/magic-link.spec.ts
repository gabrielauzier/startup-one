import { test, expect } from "@playwright/test";
import { countMails, extractLink, toBaseURL, waitForMail } from "./helpers/mailpit";
import { createConfirmedUser } from "./helpers/session";

async function requestLink(page: import("@playwright/test").Page, email: string) {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Receber link de acesso por e-mail" }).click();
  await page.waitForURL("**/entrar/link-enviado");
}

test.describe("Magic link (AUTH-06, AUTH-07, AUTH-09)", () => {
  test("e-mail existente: abrir o link em outro navegador cria a sessao la, nao no que pediu", async ({
    page,
    browser,
    baseURL,
  }) => {
    const email = `ml-existe-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "ML" });
    const before = Date.now();

    await requestLink(page, email);
    await expect(page.getByText(email)).toBeVisible();

    const mail = await waitForMail(email, { after: before });
    expect(mail.Subject).toContain("Seu acesso");
    const link = extractLink(mail.HTML, "/auth/confirm");
    expect(link).toContain("type=email");

    // Outro navegador (contexto limpo, sem cookie PKCE do que pediu o link).
    const other = await browser.newContext({ baseURL });
    const otherPage = await other.newPage();
    await otherPage.goto(toBaseURL(link, baseURL!));
    await otherPage.waitForURL("**/produtor");
    const isSession = (c: { name: string }) => c.name.endsWith("-auth-token");
    expect((await other.cookies()).some(isSession)).toBe(true);
    // O navegador que pediu so' guarda o code-verifier do PKCE, nao uma sessao.
    expect((await page.context().cookies()).some(isSession)).toBe(false);
    await other.close();
  });

  test("e-mail inexistente: mesma tela de link enviado, nenhum e-mail e nenhum usuario criado", async ({
    page,
  }) => {
    const email = `ml-nao-existe-${Date.now()}@example.com`;

    await requestLink(page, email);
    await expect(page.getByRole("heading", { name: "Confira seu e-mail" })).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(await countMails(email)).toBe(0);
    const admin = await fetch(
      "http://127.0.0.1:54321/auth/v1/admin/users?per_page=1000",
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`,
        },
      }
    );
    if (admin.ok) {
      const { users } = (await admin.json()) as { users: { email: string }[] };
      expect(users.some((u) => u.email === email)).toBe(false);
    }
  });

  test("link usado duas vezes: a segunda leva a /entrar?erro=link-expirado com o aviso", async ({
    page,
    baseURL,
  }) => {
    const email = `ml-reuso-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Reuso" });
    const before = Date.now();
    await requestLink(page, email);
    const mail = await waitForMail(email, { after: before });
    const link = toBaseURL(extractLink(mail.HTML, "/auth/confirm"), baseURL!);

    await page.goto(link);
    await page.waitForURL("**/produtor");
    await page.context().clearCookies();
    await page.goto(link);

    await page.waitForURL("**/entrar?erro=link-expirado");
    await expect(page.getByRole("status")).toContainText("Esse link já foi usado ou venceu. Peça outro.");
  });

  test("clique duplo em Reenviar dentro do cooldown envia um so e-mail e mostra a contagem", async ({
    page,
  }) => {
    const email = `ml-reenvio-${Date.now()}@example.com`;
    await createConfirmedUser(email, { role: "produtor", nome: "Reenvio" });
    const before = Date.now();
    await requestLink(page, email);
    await waitForMail(email, { after: before });

    // Logo depois do 1o envio o botao esta em cooldown.
    const reenviar = page.getByRole("button", { name: /^Reenviar/ });
    await expect(reenviar).toBeDisabled();
    await expect(reenviar).toContainText("s)");
    await reenviar.click({ force: true });
    await reenviar.click({ force: true });
    await new Promise((resolve) => setTimeout(resolve, 1500));

    expect(await countMails(email, before)).toBe(1);
  });

  test("sem cookie de contexto, /entrar/link-enviado volta a /entrar", async ({ page }) => {
    await page.goto("/entrar/link-enviado");

    await page.waitForURL("**/entrar");
  });
});
