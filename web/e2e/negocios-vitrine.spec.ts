import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import { createBusiness } from "./helpers/db";

const API_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

async function createOwnerId(prefix: string): Promise<string> {
  const email = `${prefix}-${Date.now()}@example.com`;
  const res = await fetch(`${API_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, email_confirm: true }),
  });
  const user = (await res.json()) as { id: string };
  await fetch(`${API_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ id: user.id, role: "produtor", nome: "Dono Teste" }),
  });
  return user.id;
}

test.describe("Vitrine pública /negocios (T37)", () => {
  test("CA-27.1: busca 'solidaria' encontra 'Castanha Solidária Xingu' ignorando acento/maiúsculas", async ({
    page,
  }) => {
    const ownerId = await createOwnerId("vitrine-busca");
    const suffix = Date.now();
    await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug: `castanha-solidaria-xingu-${suffix}`,
      nome: `Castanha Solidária Xingu ${suffix}`,
      status: "verificado",
      cidade_ibge: "Altamira",
      uf: "PA",
      produtos: ["Castanha"],
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
      recebe_visitas: false,
    });

    await page.goto("/negocios?q=solidaria");
    await expect(
      page.getByRole("heading", { name: new RegExp(`Castanha Solidária Xingu ${suffix}`) })
    ).toBeVisible();
  });

  test("CA-27.2: busca sem resultado mostra 'Nenhum negócio encontrado' e 'Limpar filtros'", async ({
    page,
  }) => {
    await page.goto("/negocios?q=xxxxxxxxinexistentexxxxxxxxx");

    await expect(page.getByText("Nenhum negócio encontrado")).toBeVisible();
    await expect(page.getByRole("link", { name: "Limpar filtros" })).toBeVisible();

    await page.getByRole("link", { name: "Limpar filtros" }).click();
    await expect(page).toHaveURL(/\/negocios$/);
  });

  test("RN-27: filtros de busca, produto e estado se combinam e ficam na URL", async ({
    page,
  }) => {
    const ownerId = await createOwnerId("vitrine-filtros");
    const suffix = Date.now();
    await createBusiness(ownerId, {
      cnpj: randomValidCnpj(),
      slug: `negocio-filtros-${suffix}`,
      nome: `Negócio Filtros ${suffix}`,
      status: "verificado",
      cidade_ibge: "Belém",
      uf: "PA",
      produtos: ["Cacau"],
      valor_busca: 100_000,
      prazo_meses: 24,
      nota_a: 80,
      nota_s: 80,
      nota_g: 80,
      recebe_visitas: false,
    });

    await page.goto("/negocios");
    await page.getByLabel("Buscar por nome ou cidade").fill(`Negócio Filtros ${suffix}`);
    await page.getByLabel("Produto").selectOption("Cacau");
    await page.getByLabel("Estado").selectOption("PA");
    await page.getByRole("button", { name: "Buscar" }).click();

    const url = new URL(page.url());
    expect(url.searchParams.get("q")).toBe(`Negócio Filtros ${suffix}`);
    expect(url.searchParams.get("produto")).toBe("Cacau");
    expect(url.searchParams.get("uf")).toBe("PA");
    await expect(
      page.getByRole("heading", { name: new RegExp(`Negócio Filtros ${suffix}`) })
    ).toBeVisible();

    // Recarregar a mesma URL preserva os filtros combinados (RN-27).
    await page.reload();
    await expect(
      page.getByRole("heading", { name: new RegExp(`Negócio Filtros ${suffix}`) })
    ).toBeVisible();

    // Estado (UF) diferente do negócio criado -> nenhum resultado.
    await page.getByLabel("Estado").selectOption("AC");
    await page.getByRole("button", { name: "Buscar" }).click();
    await expect(page.getByText("Nenhum negócio encontrado")).toBeVisible();
  });
});
