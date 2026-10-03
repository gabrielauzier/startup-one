import { describe, it, expect, vi } from "vitest";
import { resolvePostAuthDestination, type PostAuthDeps, type PostAuthProfile } from "../post-auth";
import type { ProfileRole } from "../redirect";

function deps(profile: PostAuthProfile | null, defaults: Partial<Record<ProfileRole, string>> = {}) {
  const calls: string[] = [];
  const d: PostAuthDeps = {
    getProfile: async () => profile,
    migrateAnswers: vi.fn(async () => void calls.push("migrate")),
    resolveDefault: async (_id, role) => {
      calls.push("default");
      return defaults[role] ?? "/default";
    },
  };
  return { d, calls };
}

const accepted = "2026-09-28T00:00:00Z";
const investor: PostAuthProfile = { role: "investidor", termos_aceitos_em: accepted };
const producer: PostAuthProfile = { role: "produtor", termos_aceitos_em: null };

describe("resolvePostAuthDestination (AUTH-01)", () => {
  it("sem perfil vai a /completar-perfil e carrega o redirect seguro", async () => {
    const { d } = deps(null);

    expect(await resolvePostAuthDestination(d, { userId: "u" })).toBe("/completar-perfil");
    expect(
      await resolvePostAuthDestination(d, { userId: "u", requested: "/negocios/x" })
    ).toBe("/completar-perfil?redirect=%2Fnegocios%2Fx");
    expect(
      await resolvePostAuthDestination(d, { userId: "u", requested: "//evil.com" })
    ).toBe("/completar-perfil");
  });

  it("investidor sem termos vai a /termos com o redirect, e migra as respostas antes", async () => {
    const { d, calls } = deps({ role: "investidor", termos_aceitos_em: null });

    const target = await resolvePostAuthDestination(d, {
      userId: "u",
      requested: "/negocios/x/documentos",
    });

    expect(target).toBe("/termos?redirect=%2Fnegocios%2Fx%2Fdocumentos");
    expect(calls).toEqual(["migrate"]);
  });

  it("empresa sem termos tambem vai a /termos; sem redirect a URL e /termos", async () => {
    const { d } = deps({ role: "empresa", termos_aceitos_em: null });

    expect(await resolvePostAuthDestination(d, { userId: "u" })).toBe("/termos");
  });

  it("produtor nao passa pelos termos nem migra respostas", async () => {
    const { d, calls } = deps(producer, { produtor: "/produtor" });

    expect(await resolvePostAuthDestination(d, { userId: "u" })).toBe("/produtor");
    expect(calls).toEqual(["default"]);
  });

  it("migra as respostas do visitante de investidor com termos aceitos antes do destino", async () => {
    const { d, calls } = deps(investor, { investidor: "/descobrir/1" });

    await resolvePostAuthDestination(d, { userId: "u" });

    expect(calls).toEqual(["migrate", "default"]);
  });

  it("honra o redirect seguro e permitido para o papel", async () => {
    const { d } = deps(investor);

    expect(
      await resolvePostAuthDestination(d, { userId: "u", requested: "/negocios/abc/documentos?x=1" })
    ).toBe("/negocios/abc/documentos?x=1");
  });

  it("investidor com /produtor/painel cai no padrao do papel", async () => {
    const { d } = deps(investor, { investidor: "/negocios" });

    expect(
      await resolvePostAuthDestination(d, { userId: "u", requested: "/produtor/painel" })
    ).toBe("/negocios");
  });

  it("produtor com /interesses cai no padrao do papel", async () => {
    const { d } = deps(producer, { produtor: "/produtor/painel" });

    expect(
      await resolvePostAuthDestination(d, { userId: "u", requested: "/interesses" })
    ).toBe("/produtor/painel");
  });

  it("redirect inseguro e ignorado", async () => {
    const { d } = deps(investor, { investidor: "/negocios" });

    for (const requested of ["//evil.com", "/\\evil.com", "https://evil.com", "/entrar"]) {
      expect(await resolvePostAuthDestination(d, { userId: "u", requested })).toBe("/negocios");
    }
  });

  it("verificador vai a /verificacao sem redirect", async () => {
    const { d } = deps(
      { role: "verificador", termos_aceitos_em: null },
      { verificador: "/verificacao" }
    );

    expect(await resolvePostAuthDestination(d, { userId: "u" })).toBe("/verificacao");
  });

  it("rota publica e honrada para qualquer papel", async () => {
    const { d } = deps(producer);

    expect(await resolvePostAuthDestination(d, { userId: "u", requested: "/negocios" })).toBe(
      "/negocios"
    );
  });
});
