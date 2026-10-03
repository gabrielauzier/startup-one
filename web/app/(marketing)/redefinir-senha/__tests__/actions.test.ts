import { describe, it, expect, vi, beforeEach } from "vitest";

const updateUser = vi.fn();
const signOut = vi.fn();
const getUser = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
const clearRecoveryFlag = vi.fn(async () => {});
const postAuthDestination = vi.fn();
const trackEvent = vi.fn(async (...a: unknown[]) => ({ ok: a.length > 0 }));

vi.mock("next/navigation", () => ({ redirect: (p: string) => redirect(p) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({ auth: { updateUser, signOut, getUser } }),
}));
vi.mock("@/lib/auth/auth-context-cookie", () => ({ clearRecoveryFlag: () => clearRecoveryFlag() }));
vi.mock("@/lib/auth/post-auth-server", () => ({
  postAuthDestination: (...a: unknown[]) => postAuthDestination(...a),
}));
vi.mock("@/lib/analytics/track", () => ({ trackEvent: (...a: unknown[]) => trackEvent(...a) }));

import { setNewPassword } from "../actions";

const form = (password: string, confirm: string) => {
  const fd = new FormData();
  fd.set("password", password);
  fd.set("confirm", confirm);
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  updateUser.mockResolvedValue({ error: null });
  signOut.mockResolvedValue({ error: null });
  postAuthDestination.mockResolvedValue("/negocios");
});

describe("setNewPassword (AUTH-14)", () => {
  it("senhas validas e iguais: updateUser, encerra as outras sessoes, solta a flag e vai ao destino com aviso", async () => {
    await expect(setNewPassword({}, form("nova-senha-1", "nova-senha-1"))).rejects.toThrow(
      "NEXT_REDIRECT:/negocios?aviso=senha-alterada"
    );

    expect(updateUser).toHaveBeenCalledWith({
      password: "nova-senha-1",
      data: { has_password: true },
    });
    expect(signOut).toHaveBeenCalledWith({ scope: "others" });
    expect(clearRecoveryFlag).toHaveBeenCalledTimes(1);
    expect(postAuthDestination).toHaveBeenCalledWith("user-1");
  });

  it("destino que ja tem query recebe o aviso com &", async () => {
    postAuthDestination.mockResolvedValue("/termos?redirect=%2Fnegocios");

    await expect(setNewPassword({}, form("nova-senha-1", "nova-senha-1"))).rejects.toThrow(
      "NEXT_REDIRECT:/termos?redirect=%2Fnegocios&aviso=senha-alterada"
    );
  });

  it("senhas diferentes bloqueiam sem chamar o Supabase", async () => {
    expect(await setNewPassword({}, form("nova-senha-1", "nova-senha-2"))).toEqual({
      passwordError: undefined,
      confirmError: "As senhas não são iguais.",
    });
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("senha fora da regra (curta, sem numero, longa) bloqueia com o requisito", async () => {
    expect((await setNewPassword({}, form("abc123", "abc123"))).passwordError).toBe(
      "Use ao menos 8 caracteres."
    );
    expect((await setNewPassword({}, form("somenteletras", "somenteletras"))).passwordError).toBe(
      "Inclua ao menos 1 número."
    );
    expect(
      (await setNewPassword({}, form("a1" + "b".repeat(71), "a1" + "b".repeat(71)))).passwordError
    ).toBe("Use no máximo 72 caracteres.");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("mesma senha da atual (same_password) devolve a mensagem especifica e nao encerra sessoes", async () => {
    updateUser.mockResolvedValue({ error: { code: "same_password", status: 422 } });

    expect(await setNewPassword({}, form("nova-senha-1", "nova-senha-1"))).toEqual({
      passwordError: "Escolha uma senha diferente da atual.",
    });
    expect(signOut).not.toHaveBeenCalled();
    expect(clearRecoveryFlag).not.toHaveBeenCalled();
  });

  it("outro erro do GoTrue devolve mensagem generica sem vazar a interna", async () => {
    updateUser.mockResolvedValue({ error: { code: "unexpected_failure", message: "db down" } });

    const result = await setNewPassword({}, form("nova-senha-1", "nova-senha-1"));

    expect(result.error).toBe("Não foi possível alterar a senha. Tente de novo.");
    expect(JSON.stringify(result)).not.toContain("db down");
  });

  it("sem sessao volta a /esqueci-senha sem alterar nada", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await expect(setNewPassword({}, form("nova-senha-1", "nova-senha-1"))).rejects.toThrow(
      "NEXT_REDIRECT:/esqueci-senha"
    );
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("registra auth_senha_alterada com o ator e sem PII; falha do evento nao impede o fluxo", async () => {
    await expect(setNewPassword({}, form("nova-senha-1", "nova-senha-1"))).rejects.toThrow("NEXT_REDIRECT");
    expect(trackEvent).toHaveBeenCalledWith({
      type: "auth_senha_alterada",
      payload: {},
      atorId: "user-1",
    });

    trackEvent.mockRejectedValueOnce(new Error("boom"));
    await expect(setNewPassword({}, form("nova-senha-1", "nova-senha-1"))).rejects.toThrow(
      "NEXT_REDIRECT:/negocios?aviso=senha-alterada"
    );
  });
});
