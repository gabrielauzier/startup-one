import { describe, it, expect, vi, beforeEach } from "vitest";

const insert = vi.fn(async () => ({ error: null as null | { message: string } }));
const getUser = vi.fn(async () => ({ data: { user: { id: "user-1" } as { id: string } | null } }));
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
const postAuthDestination = vi.fn(async (...args: unknown[]) => (args.length >= 0 ? "/produtor" : ""));

vi.mock("next/navigation", () => ({ redirect: (p: string) => redirect(p) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({
    auth: { getUser },
    from: (table: string) => ({ insert: (row: unknown) => (insert as (r: unknown) => ReturnType<typeof insert>)({ table, ...(row as object) }) }),
  }),
}));
vi.mock("@/lib/auth/post-auth-server", () => ({
  postAuthDestination: (...args: unknown[]) => postAuthDestination(...args),
}));

import { completeProfile } from "../actions";

const form = (values: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  insert.mockResolvedValue({ error: null });
});

describe("completeProfile (AUTH-11)", () => {
  it("rejeita perfil invalido, inclusive verificador, sem tocar no banco", async () => {
    for (const role of ["verificador", "xyz", ""]) {
      const result = await completeProfile({}, form({ role, nome: "Maria" }));

      expect(result.roleError).toBe("Escolha como você usa a Îasy.");
    }
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejeita nome com menos de 2 ou mais de 80 caracteres", async () => {
    for (const nome of ["A", "  ", "x".repeat(81)]) {
      const result = await completeProfile({}, form({ role: "produtor", nome }));

      expect(result.nomeError).toBe("Informe seu nome com 2 a 80 caracteres.");
    }
    expect(insert).not.toHaveBeenCalled();
  });

  it("insere o profile do usuario e redireciona pelo destino pos-autenticacao com o redirect", async () => {
    await expect(
      completeProfile({}, form({ role: "produtor", nome: " Maria ", redirect: "/negocios" }))
    ).rejects.toThrow("NEXT_REDIRECT:/produtor");

    expect(insert).toHaveBeenCalledWith({
      table: "profiles",
      id: "user-1",
      role: "produtor",
      nome: "Maria",
    });
    expect(postAuthDestination).toHaveBeenCalledWith("user-1", "/negocios");
  });

  it("sem usuario logado redireciona a /entrar", async () => {
    getUser.mockResolvedValueOnce({ data: { user: null } });

    await expect(
      completeProfile({}, form({ role: "produtor", nome: "Maria" }))
    ).rejects.toThrow("NEXT_REDIRECT:/entrar");
    expect(insert).not.toHaveBeenCalled();
  });

  it("erro do banco devolve mensagem generica sem vazar a interna", async () => {
    insert.mockResolvedValueOnce({ error: { message: "violates policy xyz" } });

    const result = await completeProfile({}, form({ role: "produtor", nome: "Maria" }));

    expect(result.error).toBe("Não foi possível salvar seu perfil. Tente de novo.");
    expect(JSON.stringify(result)).not.toContain("policy");
  });
});
