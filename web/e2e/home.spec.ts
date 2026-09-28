import { test, expect } from "@playwright/test";

const FORBIDDEN_TERMS = [
  "investir agora",
  "rendimento",
  "retorno garantido",
  "captado",
  "captação",
];

test.describe("Página inicial /", () => {
  test("renderiza os 4 passos, os dois botões de caminho e o rodapé de conexão (RN-04)", async ({
    page,
  }) => {
    await page.goto("/");

    for (const step of ["Organizar", "Verificar", "Encontrar", "Conectar"]) {
      await expect(page.getByRole("heading", { name: step })).toBeVisible();
    }

    await expect(
      page.getByRole("link", { name: "Sou produtor, quero ser encontrado" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Sou investidor, quero conhecer negócios" })
    ).toBeVisible();

    await expect(
      page.getByText(
        "A Îasy não recebe nem movimenta dinheiro. O contrato e o pagamento são feitos por um parceiro financeiro autorizado."
      )
    ).toBeVisible();
  });

  test("nao contem nenhum termo proibido de RN-04", async ({ page }) => {
    await page.goto("/");
    const html = (await page.content()).toLowerCase();

    for (const term of FORBIDDEN_TERMS) {
      expect(html).not.toContain(term);
    }
  });
});
