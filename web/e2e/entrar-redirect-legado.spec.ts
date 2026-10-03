import { test, expect } from "@playwright/test";

test.describe("/entrar/codigo legado (AUTH-05, premissa Q1)", () => {
  test("responde 308 para /entrar", async ({ request }) => {
    const res = await request.get("/entrar/codigo", { maxRedirects: 0 });

    expect(res.status()).toBe(308);
    expect(new URL(res.headers()["location"], "http://localhost").pathname).toBe("/entrar");
  });

  test("abrir /entrar/codigo?email=... no navegador cai na tela de entrada", async ({ page }) => {
    await page.goto("/entrar/codigo?email=x@y.com&role=investidor");

    await page.waitForURL(/\/entrar(\?|$)/);
    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
  });
});
