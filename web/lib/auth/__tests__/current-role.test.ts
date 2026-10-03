import { describe, it, expect, vi, beforeEach } from "vitest";

let user: { id: string; user_metadata?: Record<string, unknown> } | null = null;
let profile: { role: string } | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user } }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profile }) }) }) }),
  }),
}));

import { getCurrentAuthState, getCurrentRole } from "../current-role";

beforeEach(() => {
  user = null;
  profile = null;
});

describe("getCurrentAuthState (AUTH-18)", () => {
  it("sem sessao: sem papel e sem aviso", async () => {
    expect(await getCurrentAuthState()).toEqual({ role: null, needsPassword: false });
  });

  it("logado com perfil e sem has_password no metadado precisa definir senha", async () => {
    user = { id: "u", user_metadata: {} };
    profile = { role: "produtor" };

    expect(await getCurrentAuthState()).toEqual({ role: "produtor", needsPassword: true });
  });

  it("has_password=true no metadado nao precisa", async () => {
    user = { id: "u", user_metadata: { has_password: true } };
    profile = { role: "investidor" };

    expect(await getCurrentAuthState()).toEqual({ role: "investidor", needsPassword: false });
  });

  it("logado sem perfil nao mostra o aviso (cai em /completar-perfil)", async () => {
    user = { id: "u", user_metadata: {} };

    expect(await getCurrentAuthState()).toEqual({ role: null, needsPassword: false });
  });

  it("getCurrentRole continua devolvendo so o papel", async () => {
    user = { id: "u" };
    profile = { role: "empresa" };

    expect(await getCurrentRole()).toBe("empresa");
  });
});
