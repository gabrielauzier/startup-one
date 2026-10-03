import { describe, it, expect } from "vitest";
import {
  resolvePostLoginRedirect,
  isSafeRedirect,
  normalizeNext,
  roleHome,
} from "../redirect";

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

describe("isSafeRedirect (AUTH-01, critérios 3 e 4)", () => {
  it("aceita caminhos internos relativos, com query", () => {
    expect(isSafeRedirect("/negocios/abc?x=1")).toBe(true);
    expect(isSafeRedirect("/negocios/coop-acai-mujuu/documentos")).toBe(true);
    expect(isSafeRedirect("/produtor/painel")).toBe(true);
    expect(isSafeRedirect("/")).toBe(true);
  });

  it.each([
    "//evil.com",
    "/\\evil.com",
    "/%5Cevil.com",
    "/%2Fevil.com",
    "https://evil.com",
    "",
    "/ok\u0000x",
    "/ok\nx",
    "/entrar",
    "/entrar?redirect=/negocios",
    "/cadastro",
    "/cadastro/confirmar-email",
    "/esqueci-senha",
    "/esqueci-senha/codigo",
    "/redefinir-senha",
    "/completar-perfil",
    "/auth/x",
    "/auth/confirm?token_hash=abc",
    "/%",
  ])("rejeita %j", (path) => {
    expect(isSafeRedirect(path)).toBe(false);
  });

  it("nao confunde prefixo parecido com tela de auth", () => {
    expect(isSafeRedirect("/entrarx")).toBe(true);
    expect(isSafeRedirect("/authors")).toBe(true);
  });
});

describe("normalizeNext (AUTH-04 critério 12)", () => {
  const origin = "http://localhost:3000";

  it("aceita caminho interno seguro", () => {
    expect(normalizeNext("/negocios?x=1", origin)).toBe("/negocios?x=1");
  });

  it("aceita URL absoluta da mesma origem e devolve so pathname + query", () => {
    expect(normalizeNext("http://localhost:3000/negocios/abc?x=1", origin)).toBe(
      "/negocios/abc?x=1"
    );
  });

  it("rejeita URL de outra origem", () => {
    expect(normalizeNext("http://evil.com/negocios", origin)).toBeNull();
  });

  it("rejeita destino inseguro mesmo na mesma origem", () => {
    expect(normalizeNext("http://localhost:3000/entrar", origin)).toBeNull();
    expect(normalizeNext("//evil.com", origin)).toBeNull();
  });

  it("usa o primeiro valor de uma lista", () => {
    expect(normalizeNext(["/negocios", "/produtor"], origin)).toBe("/negocios");
  });

  it("devolve null para vazio, ausente ou invalido", () => {
    expect(normalizeNext("", origin)).toBeNull();
    expect(normalizeNext(null, origin)).toBeNull();
    expect(normalizeNext(undefined, origin)).toBeNull();
    expect(normalizeNext("nao-e-url", origin)).toBeNull();
  });
});

describe("roleHome (AUTH-01 critério 7a)", () => {
  it("devolve a pagina inicial de cada papel", () => {
    expect(roleHome("verificador")).toBe("/verificacao");
    expect(roleHome("produtor")).toBe("/produtor");
    expect(roleHome("investidor")).toBe("/negocios");
    expect(roleHome("empresa")).toBe("/negocios");
  });
});
