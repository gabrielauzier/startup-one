import { test, expect } from "@playwright/test";
import { randomValidCnpj } from "./helpers/cnpj";
import { createBusiness } from "./helpers/db";

const API_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

function headers() {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
}

async function certifyBusiness(businessId: string): Promise<void> {
  await fetch(`${API_URL}/rest/v1/certifications`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      business_id: businessId,
      certificadora: "IBD",
      conferido: true,
    }),
  });
}

/**
 * Cria um dono (produtor) direto via admin API - mais rapido que o
 * fluxo completo de OTP no browser (`loginAsProducer`), ja' que este
 * teste so' precisa de um `owner_id` valido para os negocios
 * semeados, nunca faz login como ele. Varios negocios podem
 * compartilhar o mesmo dono (sem unicidade em `owner_id`).
 */
async function createOwnerId(): Promise<string> {
  const email = `resultados-owner-${Date.now()}@example.com`;
  const res = await fetch(`${API_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ email, email_confirm: true }),
  });
  const user = (await res.json()) as { id: string };
  await fetch(`${API_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: { ...headers(), Prefer: "return=minimal" },
    body: JSON.stringify({ id: user.id, role: "produtor", nome: "Dono Teste" }),
  });
  return user.id;
}

// RN-24: com a investidora escolhendo prioridade "equilibrio", produtos
// "Todos" (30), faixa 50-200 mil (25), prazo até 36 meses (20) e
// pulando a pergunta 5 (impacto fixo em 8), o alinhamento de cada
// negócio fica em 83 + 10*média(notas)/100 - variar so' as notas (e a
// data de verificação) isola exatamente o desempate de RN-24.
async function seedBusiness(ownerId: string, overrides: Record<string, unknown>): Promise<string> {
  return createBusiness(ownerId, {
    cnpj: randomValidCnpj(),
    slug: `negocio-resultados-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "verificado",
    produtos: ["Açaí"],
    valor_busca: 100_000,
    prazo_meses: 24,
    recebe_visitas: false,
    ...overrides,
  });
}

/**
 * O banco local e' compartilhado entre todos os arquivos de e2e (nao
 * ha' reset entre specs) - outras suites tambem deixam negocios
 * `verificado` para tras, que aparecem misturados nesta tela. Em vez
 * de assumir a contagem total de cards, filtra so' os nomes deste
 * `runId` (unico por execucao) e olha a ordem relativa entre eles.
 */
function extractOrderForRun(names: string[], runId: string): string[] {
  return names
    .map((name) => name.match(new RegExp(`^Negócio (\\w) ${runId}$`)))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => match[1]);
}

test.describe("Tela de resultados /descobrir/resultados (T36)", () => {
  test("ordena por alinhamento e desempata por média das notas, depois verificação mais recente (RN-24); filtro 'Com selo' remove quem não tem (CA-25.1)", async ({
    page,
  }) => {
    const ownerId = await createOwnerId();
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // A: média 90, verificado agora -> alinhamento arredonda para 92.
    const businessA = await seedBusiness(ownerId, {
      nome: `Negócio A ${runId}`,
      nota_a: 90,
      nota_s: 90,
      nota_g: 90,
      verificado_em: new Date().toISOString(),
    });
    // D: média 90 também, mas verificado há 6 meses -> mesmo alinhamento
    // (92) e mesma média de A; desempata por verificação mais recente
    // (A deve vir antes de D).
    const businessD = await seedBusiness(ownerId, {
      nome: `Negócio D ${runId}`,
      nota_a: 90,
      nota_s: 90,
      nota_g: 90,
      verificado_em: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    });
    // C: média 89 -> alinhamento também arredonda para 92, mas com
    // média menor que A/D -> fica depois dos dois na ordenação.
    const businessC = await seedBusiness(ownerId, {
      nome: `Negócio C ${runId}`,
      nota_a: 89,
      nota_s: 89,
      nota_g: 89,
      verificado_em: new Date().toISOString(),
    });
    // B: média 60 -> alinhamento 89, menor que os demais, mas ainda
    // acima do corte de 40%.
    const businessB = await seedBusiness(ownerId, {
      nome: `Negócio B ${runId}`,
      nota_a: 60,
      nota_s: 60,
      nota_g: 60,
      verificado_em: new Date().toISOString(),
    });

    await certifyBusiness(businessA);

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

    await expect(async () => {
      const names = await page.locator("h3").allTextContents();
      expect(extractOrderForRun(names, runId)).toEqual(["A", "D", "C", "B"]);
    }).toPass();

    // CA-25.1: filtro "Com selo de certificadora" só deixa o negócio A
    // (o único certificado) entre os negócios criados por este teste.
    await page.getByRole("link", { name: "Com selo de certificadora" }).click();
    await expect(page).toHaveURL(/filtro=com_selo/);
    await expect(async () => {
      const names = await page.locator("h3").allTextContents();
      expect(extractOrderForRun(names, runId)).toEqual(["A"]);
    }).toPass();

    void businessB;
    void businessC;
    void businessD;
  });
});
