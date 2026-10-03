import { describe, it, expect, vi, beforeEach } from "vitest";

const signOut = vi.fn(async () => ({ error: null }));
const getUser = vi.fn(async () => ({ data: { user: { id: "user-1" } } }));
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
const trackEvent = vi.fn(async (...args: unknown[]) => ({ ok: args.length >= 0 }));
const clearAuthContext = vi.fn(async () => {});
const clearRecoveryFlag = vi.fn(async () => {});

vi.mock("next/navigation", () => ({ redirect: (p: string) => redirect(p) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({ auth: { signOut, getUser } }),
}));
vi.mock("@/lib/analytics/track", () => ({ trackEvent: (i: unknown) => trackEvent(i) }));
vi.mock("../auth-context-cookie", () => ({
  clearAuthContext: () => clearAuthContext(),
  clearRecoveryFlag: () => clearRecoveryFlag(),
}));

import { signOutAction } from "../sign-out";

beforeEach(() => vi.clearAllMocks());

describe("signOutAction (AUTH-16)", () => {
  it("encerra a sessao, limpa os cookies de auth e redireciona para /", async () => {
    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT:/");

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(clearAuthContext).toHaveBeenCalledTimes(1);
    expect(clearRecoveryFlag).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("registra auth_logout com o ator e sem PII no payload", async () => {
    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT");

    expect(trackEvent).toHaveBeenCalledWith({
      type: "auth_logout",
      payload: {},
      atorId: "user-1",
    });
  });

  it("falha ao registrar o evento nao impede o logout", async () => {
    trackEvent.mockRejectedValueOnce(new Error("boom"));

    await expect(signOutAction()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
