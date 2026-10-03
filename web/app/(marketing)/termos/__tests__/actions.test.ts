import { describe, it, expect, vi, beforeEach } from "vitest";

function selectChain(result: unknown) {
  return {
    eq: () => ({
      single: () => Promise.resolve(result),
      maybeSingle: () => Promise.resolve({ data: null }),
    }),
  };
}

const getUserMock = vi.fn();
const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
let profileRoleResult: { data: { role: string } | null } = {
  data: { role: "investidor" },
};

const sessionFromMock = vi.fn(() => ({
  update: updateMock,
  select: () => selectChain(profileRoleResult),
}));

const createServerClientMock = vi.fn().mockResolvedValue({
  auth: { getUser: getUserMock },
  from: sessionFromMock,
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));

// AUTH-01: o destino vem de `postAuthDestination` (valida o redirect pelo
// papel); o padrao do investidor sem respostas e' /descobrir/1.
const postAuthDestinationMock = vi.fn(
  async (_userId: string, requested?: string | null) => requested || "/descobrir/1"
);

vi.mock("@/lib/auth/post-auth-server", () => ({
  postAuthDestination: (userId: string, requested?: string | null) =>
    postAuthDestinationMock(userId, requested),
}));

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

function formData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "user-123" } } });
  updateMock.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  profileRoleResult = { data: { role: "investidor" } };
});

describe("acceptTerms (CA-03.2)", () => {
  it("grava termos_versao e termos_aceitos_em no profile do usuario logado", async () => {
    const { acceptTerms } = await import("../actions");

    await expect(
      acceptTerms({}, formData({ redirect: "" }))
    ).rejects.toThrow("REDIRECT:/descobrir/1");

    expect(sessionFromMock).toHaveBeenCalledWith("profiles");
    expect(updateMock).toHaveBeenCalledTimes(1);
    const payload = updateMock.mock.calls[0][0];
    expect(payload.termos_versao).toBeTruthy();
    expect(new Date(payload.termos_aceitos_em).toString()).not.toBe("Invalid Date");
  });

  it("redireciona para a URL original quando presente (CA-02.3)", async () => {
    const { acceptTerms } = await import("../actions");

    await expect(
      acceptTerms(
        {},
        formData({ redirect: "/negocios/coop-acai-mujuu/documentos" })
      )
    ).rejects.toThrow("REDIRECT:/negocios/coop-acai-mujuu/documentos");
    expect(postAuthDestinationMock).toHaveBeenCalledWith(
      "user-123",
      "/negocios/coop-acai-mujuu/documentos"
    );
  });

  it("delega ao destino pos-autenticacao o redirect que o papel nao pode acessar (nao o honra direto)", async () => {
    postAuthDestinationMock.mockResolvedValueOnce("/negocios");
    const { acceptTerms } = await import("../actions");

    await expect(
      acceptTerms({}, formData({ redirect: "/produtor/painel" }))
    ).rejects.toThrow("REDIRECT:/negocios");
    expect(postAuthDestinationMock).toHaveBeenCalledWith("user-123", "/produtor/painel");
  });

  it("manda de volta para /entrar se nao houver sessao", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { acceptTerms } = await import("../actions");

    await expect(acceptTerms({}, formData({ redirect: "" }))).rejects.toThrow(
      "REDIRECT:/entrar"
    );
    expect(updateMock).not.toHaveBeenCalled();
  });
});
