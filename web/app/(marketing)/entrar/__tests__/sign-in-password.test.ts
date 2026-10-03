import { describe, it, expect, vi, beforeEach } from "vitest";

const signInWithPassword = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
const postAuthDestination = vi.fn(async (...a: unknown[]) => (a.length ? "/negocios" : ""));
const trackEvent = vi.fn(async (...a: unknown[]) => ({ ok: a.length > 0 }));

vi.mock("next/navigation", () => ({ redirect: (p: string) => redirect(p) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({ auth: { signInWithPassword } }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/app/(investor)/descobrir/actions", () => ({ migrateCookieAnswersToProfile: vi.fn() }));
vi.mock("@/lib/auth/post-auth-server", () => ({
  postAuthDestination: (...a: unknown[]) => postAuthDestination(...a),
}));
vi.mock("@/lib/analytics/track", () => ({ trackEvent: (...a: unknown[]) => trackEvent(...a) }));

import { signInPassword } from "../actions";

const form = (values: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  signInWithPassword.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
});

describe("signInPassword (AUTH-05)", () => {
  it("credenciais corretas autenticam e redirecionam pelo destino pos-autenticacao", async () => {
    await expect(
      signInPassword({}, form({ email: " Foo@Bar.com ", password: "abc12345", redirect: "/negocios/x" }))
    ).rejects.toThrow("NEXT_REDIRECT:/negocios");

    expect(signInWithPassword).toHaveBeenCalledWith({ email: "foo@bar.com", password: "abc12345" });
    expect(postAuthDestination).toHaveBeenCalledWith("user-1", "/negocios/x");
  });

  it("senha errada e e-mail inexistente devolvem exatamente a mesma mensagem", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: "invalid_credentials", status: 400, message: "Invalid login credentials" },
    });

    const wrongPassword = await signInPassword({}, form({ email: "a@b.com", password: "errada1" }));
    const unknownEmail = await signInPassword({}, form({ email: "x@y.com", password: "errada1" }));

    expect(wrongPassword.error).toBe("E-mail ou senha incorretos.");
    expect(unknownEmail.error).toBe(wrongPassword.error);
    expect(wrongPassword.unconfirmed).toBeUndefined();
  });

  it("conta do MVP sem senha tambem recebe a mensagem generica (nao revela que nao tem senha)", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: "invalid_credentials", status: 400, message: "Invalid login credentials" },
    });

    const result = await signInPassword({}, form({ email: "mvp@b.com", password: "qualquer1" }));

    expect(result.error).toBe("E-mail ou senha incorretos.");
  });

  it("email_not_confirmed devolve unconfirmed e a mensagem de confirmar o e-mail", async () => {
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: "email_not_confirmed", status: 400, message: "Email not confirmed" },
    });

    const result = await signInPassword({}, form({ email: "a@b.com", password: "abc12345" }));

    expect(result).toEqual({
      email: "a@b.com",
      unconfirmed: true,
      error: "Confirme seu e-mail para entrar.",
    });
  });

  it.each([
    { status: 429, code: undefined },
    { status: 400, code: "over_request_rate_limit" },
  ])("rate limit ($status/$code) devolve a mensagem de espera", async (error) => {
    signInWithPassword.mockResolvedValue({ data: { user: null }, error });

    const result = await signInPassword({}, form({ email: "a@b.com", password: "abc12345" }));

    expect(result.error).toBe("Muitas tentativas. Aguarde alguns minutos e tente de novo.");
  });

  it("e-mail ou senha vazios nao chamam o Supabase", async () => {
    expect((await signInPassword({}, form({ email: "", password: "x" }))).emailError).toBe(
      "Informe seu e-mail."
    );
    expect((await signInPassword({}, form({ email: "a@b.com", password: "" }))).passwordError).toBe(
      "Informe sua senha."
    );
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("registra auth_login_senha_ok com o ator e auth_login_senha_erro sem PII", async () => {
    await expect(
      signInPassword({}, form({ email: "a@b.com", password: "abc12345" }))
    ).rejects.toThrow("NEXT_REDIRECT");
    signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { code: "invalid_credentials", status: 400, message: "x" },
    });
    await signInPassword({}, form({ email: "a@b.com", password: "errada1" }));

    expect(trackEvent).toHaveBeenNthCalledWith(1, {
      type: "auth_login_senha_ok",
      payload: {},
      atorId: "user-1",
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, {
      type: "auth_login_senha_erro",
      payload: {},
      atorId: null,
    });
  });

  it("falha ao registrar o evento nao impede o login", async () => {
    trackEvent.mockRejectedValue(new Error("boom"));

    await expect(
      signInPassword({}, form({ email: "a@b.com", password: "abc12345" }))
    ).rejects.toThrow("NEXT_REDIRECT:/negocios");
  });
});
