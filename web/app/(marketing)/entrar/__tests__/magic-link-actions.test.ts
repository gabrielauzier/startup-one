import { describe, it, expect, vi, beforeEach } from "vitest";

const signInWithOtp = vi.fn();
const resend = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
const checkAndRecordSend = vi.fn();
const setAuthContext = vi.fn(async (...a: unknown[]) => void a);
const readAuthContext = vi.fn();
const trackEvent = vi.fn(async (...a: unknown[]) => ({ ok: a.length > 0 }));

vi.mock("next/navigation", () => ({ redirect: (p: string) => redirect(p) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({ auth: { signInWithOtp, resend } }),
}));
vi.mock("@/lib/auth/origin", () => ({ requestOrigin: async () => "https://iasy.test" }));
vi.mock("@/lib/auth/throttle", () => ({
  checkAndRecordSend: (...a: unknown[]) => checkAndRecordSend(...a),
}));
vi.mock("@/lib/auth/auth-context-cookie", () => ({
  setAuthContext: (...a: unknown[]) => setAuthContext(...a),
  readAuthContext: (...a: unknown[]) => readAuthContext(...a),
}));
vi.mock("@/lib/analytics/track", () => ({ trackEvent: (...a: unknown[]) => trackEvent(...a) }));

import { requestMagicLink, resendConfirmation, resendMagicLink } from "../magic-link-actions";

const form = (values: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  checkAndRecordSend.mockResolvedValue({ allowed: true });
  signInWithOtp.mockResolvedValue({ error: null });
  resend.mockResolvedValue({ error: null });
});

describe("requestMagicLink (AUTH-06)", () => {
  it("chama signInWithOtp com shouldCreateUser:false, grava o contexto e redireciona sem e-mail na URL", async () => {
    await expect(
      requestMagicLink({}, form({ email: " Foo@Bar.com ", redirect: "/negocios/x" }))
    ).rejects.toThrow("NEXT_REDIRECT:/entrar/link-enviado");

    expect(signInWithOtp).toHaveBeenCalledWith({
      email: "foo@bar.com",
      options: { shouldCreateUser: false, emailRedirectTo: "https://iasy.test/negocios/x" },
    });
    expect(setAuthContext).toHaveBeenCalledWith({ email: "foo@bar.com", kind: "magic" });
    expect(checkAndRecordSend).toHaveBeenCalledWith("foo@bar.com", "magic");
    expect(redirect).toHaveBeenCalledWith("/entrar/link-enviado");
  });

  it("sem redirect nao envia emailRedirectTo; redirect inseguro e ignorado", async () => {
    await expect(requestMagicLink({}, form({ email: "a@b.com" }))).rejects.toThrow("NEXT_REDIRECT");
    await expect(
      requestMagicLink({}, form({ email: "a@b.com", redirect: "//evil.com" }))
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(signInWithOtp.mock.calls[0][0].options.emailRedirectTo).toBeUndefined();
    expect(signInWithOtp.mock.calls[1][0].options.emailRedirectTo).toBeUndefined();
  });

  it("e-mail sem conta (otp_disabled) tem resultado identico ao de e-mail com conta", async () => {
    signInWithOtp.mockResolvedValueOnce({ error: { code: "otp_disabled", status: 422 } });

    await expect(requestMagicLink({}, form({ email: "naoexiste@b.com" }))).rejects.toThrow(
      "NEXT_REDIRECT:/entrar/link-enviado"
    );
    expect(setAuthContext).toHaveBeenCalledWith({ email: "naoexiste@b.com", kind: "magic" });
  });

  it("falha de SMTP devolve a mensagem generica sem expor a interna", async () => {
    signInWithOtp.mockResolvedValueOnce({
      error: { code: "unexpected_failure", status: 500, message: "smtp host unreachable" },
    });

    const result = await requestMagicLink({}, form({ email: "a@b.com" }));

    expect(result.error).toBe("Não foi possível enviar o e-mail. Tente de novo.");
    expect(JSON.stringify(result)).not.toContain("smtp");
    expect(setAuthContext).not.toHaveBeenCalled();
  });

  it("throttle em cooldown devolve a espera restante e nao envia", async () => {
    checkAndRecordSend.mockResolvedValueOnce({
      allowed: false,
      reason: "cooldown",
      retryAfterSec: 40,
    });

    const result = await requestMagicLink({}, form({ email: "a@b.com" }));

    expect(result).toEqual({ error: "Aguarde 40 s para pedir de novo.", retryAfterSec: 40 });
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("e-mail invalido nao chama throttle nem Supabase", async () => {
    expect((await requestMagicLink({}, form({ email: "sem-arroba" }))).error).toBe(
      "Informe um e-mail válido."
    );
    expect(checkAndRecordSend).not.toHaveBeenCalled();
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it("registra auth_magic_link_pedido sem PII", async () => {
    await expect(requestMagicLink({}, form({ email: "a@b.com" }))).rejects.toThrow("NEXT_REDIRECT");

    expect(trackEvent).toHaveBeenCalledWith({ type: "auth_magic_link_pedido", payload: {} });
  });
});

describe("resendMagicLink (AUTH-09)", () => {
  it("reenvia para o e-mail do cookie e devolve sent com cooldown de 60 s", async () => {
    readAuthContext.mockResolvedValue({ email: "foo@bar.com" });

    expect(await resendMagicLink({}, form({}))).toEqual({ sent: true, retryAfterSec: 60 });
    expect(readAuthContext).toHaveBeenCalledWith("magic");
    expect(signInWithOtp).toHaveBeenCalledTimes(1);
  });

  it("sem cookie valido redireciona a /entrar", async () => {
    readAuthContext.mockResolvedValue(null);

    await expect(resendMagicLink({}, form({}))).rejects.toThrow("NEXT_REDIRECT:/entrar");
  });

  it("dentro do cooldown (clique duplo) envia um so e-mail", async () => {
    readAuthContext.mockResolvedValue({ email: "foo@bar.com" });
    checkAndRecordSend
      .mockResolvedValueOnce({ allowed: true })
      .mockResolvedValueOnce({ allowed: false, reason: "cooldown", retryAfterSec: 59 });

    await resendMagicLink({}, form({}));
    const second = await resendMagicLink({}, form({}));

    expect(signInWithOtp).toHaveBeenCalledTimes(1);
    expect(second.retryAfterSec).toBe(59);
  });

  it("teto de 3 por hora devolve a mensagem de muitos pedidos", async () => {
    readAuthContext.mockResolvedValue({ email: "foo@bar.com" });
    checkAndRecordSend.mockResolvedValue({ allowed: false, reason: "hourly-cap", retryAfterSec: 1800 });

    expect((await resendMagicLink({}, form({}))).error).toBe(
      "Muitos pedidos. Tente de novo em alguns minutos."
    );
  });
});

describe("resendConfirmation (AUTH-02 critérios 13 a 15, AUTH-05 critério 4)", () => {
  it("na tela de confirmar e-mail le o cookie, reenvia type=signup e fica na tela", async () => {
    readAuthContext.mockResolvedValue({ email: "foo@bar.com" });

    expect(await resendConfirmation({}, form({}))).toEqual({ sent: true, retryAfterSec: 60 });
    expect(readAuthContext).toHaveBeenCalledWith("signup");
    expect(resend).toHaveBeenCalledWith({ type: "signup", email: "foo@bar.com" });
    expect(checkAndRecordSend).toHaveBeenCalledWith("foo@bar.com", "signup");
  });

  it("vindo de /entrar com o e-mail no form grava o contexto e vai a /cadastro/confirmar-email", async () => {
    await expect(resendConfirmation({}, form({ email: "Foo@Bar.com" }))).rejects.toThrow(
      "NEXT_REDIRECT:/cadastro/confirmar-email"
    );

    expect(resend).toHaveBeenCalledWith({ type: "signup", email: "foo@bar.com" });
    expect(setAuthContext).toHaveBeenCalledWith({ email: "foo@bar.com", kind: "signup" });
  });

  it("sem cookie nem e-mail redireciona a /cadastro", async () => {
    readAuthContext.mockResolvedValue(null);

    await expect(resendConfirmation({}, form({}))).rejects.toThrow("NEXT_REDIRECT:/cadastro");
  });

  it("4o pedido na hora devolve a mensagem de muitos pedidos e nao reenvia", async () => {
    readAuthContext.mockResolvedValue({ email: "foo@bar.com" });
    checkAndRecordSend.mockResolvedValue({ allowed: false, reason: "hourly-cap", retryAfterSec: 900 });

    const result = await resendConfirmation({}, form({}));

    expect(result.error).toBe("Muitos pedidos. Tente de novo em alguns minutos.");
    expect(resend).not.toHaveBeenCalled();
  });

  it("falha do provedor devolve a mensagem generica", async () => {
    readAuthContext.mockResolvedValue({ email: "foo@bar.com" });
    resend.mockResolvedValueOnce({ error: { status: 500, message: "smtp down" } });

    const result = await resendConfirmation({}, form({}));

    expect(result.error).toBe("Não foi possível enviar o e-mail. Tente de novo.");
  });
});
