import { describe, it, expect } from "vitest";
import { resolvePostLoginRedirect, isSafeRedirect } from "../redirect";

function fakeAdmin(tableData: Record<string, unknown | null>) {
  return {
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: tableData[table] ?? null }),
        }),
      }),
    }),
  } as unknown as Parameters<typeof resolvePostLoginRedirect>[0];
}

describe("resolvePostLoginRedirect (RF-03)", () => {
  it("verificador vai para a fila de verificacao", async () => {
    const admin = fakeAdmin({});
    const target = await resolvePostLoginRedirect(admin, "user-1", "verificador");
    expect(target).toBe("/verificacao");
  });

  it("produtor sem cadastro enviado vai para as boas-vindas", async () => {
    const admin = fakeAdmin({ businesses: null });
    const target = await resolvePostLoginRedirect(admin, "user-1", "produtor");
    expect(target).toBe("/produtor");
  });

  it("produtor com cadastro ja enviado vai para o painel", async () => {
    const admin = fakeAdmin({ businesses: { id: "biz-1" } });
    const target = await resolvePostLoginRedirect(admin, "user-1", "produtor");
    expect(target).toBe("/produtor/painel");
  });

  it("investidor sem respostas ainda vai para a descoberta", async () => {
    const admin = fakeAdmin({ investor_answers: null });
    const target = await resolvePostLoginRedirect(admin, "user-1", "investidor");
    expect(target).toBe("/descobrir/1");
  });

  it("investidor que ja respondeu vai direto para a vitrine", async () => {
    const admin = fakeAdmin({ investor_answers: { investor_id: "user-1" } });
    const target = await resolvePostLoginRedirect(admin, "user-1", "investidor");
    expect(target).toBe("/negocios");
  });

  it("empresa segue a mesma regra do investidor", async () => {
    const semResposta = fakeAdmin({ investor_answers: null });
    expect(await resolvePostLoginRedirect(semResposta, "user-1", "empresa")).toBe(
      "/descobrir/1"
    );

    const comResposta = fakeAdmin({
      investor_answers: { investor_id: "user-1" },
    });
    expect(await resolvePostLoginRedirect(comResposta, "user-1", "empresa")).toBe(
      "/negocios"
    );
  });
});

describe("isSafeRedirect (CA-02.3)", () => {
  it("aceita caminhos internos relativos", () => {
    expect(isSafeRedirect("/negocios/coop-acai-mujuu/documentos")).toBe(true);
    expect(isSafeRedirect("/produtor/painel")).toBe(true);
  });

  it("rejeita URLs absolutas e o truque protocol-relative", () => {
    expect(isSafeRedirect("https://evil.com")).toBe(false);
    expect(isSafeRedirect("//evil.com")).toBe(false);
    expect(isSafeRedirect("")).toBe(false);
  });
});
