import { describe, it, expect, vi, beforeEach } from "vitest";

const verifyOtp = vi.fn();
const resetPasswordForEmail = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
const readAuthContext = vi.fn();
const setRecoveryFlag = vi.fn(async () => {});
const checkAndRecordSend = vi.fn();
const trackEvent = vi.fn(async (...a: unknown[]) => ({ ok: a.length > 0 }));

vi.mock("next/navigation", () => ({ redirect: (p: string) => redirect(p) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({ auth: { verifyOtp, resetPasswordForEmail } }),
}));
vi.mock("@/lib/auth/auth-context-cookie", () => ({
  readAuthContext: (...a: unknown[]) => readAuthContext(...a),
  setRecoveryFlag: () => setRecoveryFlag(),
}));
vi.mock("@/lib/auth/throttle", () => ({
  checkAndRecordSend: (...a: unknown[]) => checkAndRecordSend(...a),
}));
vi.mock("@/lib/analytics/track", () => ({ trackEvent: (...a: unknown[]) => trackEvent(...a) }));

import { resendResetCode, verifyResetCode } from "../actions";

const form = (code: string) => {
  const fd = new FormData();
  fd.set("code", code);
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  readAuthContext.mockResolvedValue({ email: "foo@bar.com" });
  verifyOtp.mockResolvedValue({ data: { session: { access_token: "t" } }, error: null });
  checkAndRecordSend.mockResolvedValue({ allowed: true });
  resetPasswordForEmail.mockResolvedValue({ error: null });
});

describe("verifyResetCode (AUTH-08, critérios 4 a 9)", () => {
  it("codigo correto chama verifyOtp type=recovery com o e-mail do cookie, abre a flag e vai a /redefinir-senha", async () => {
    await expect(verifyResetCode({}, form("123456"))).rejects.toThrow(
      "NEXT_REDIRECT:/redefinir-senha"
    );

    expect(readAuthContext).toHaveBeenCalledWith("reset");
    expect(verifyOtp).toHaveBeenCalledWith({
      email: "foo@bar.com",
      token: "123456",
      type: "recovery",
    });
    expect(setRecoveryFlag).toHaveBeenCalledTimes(1);
  });

  it("remove espacos colados antes de validar", async () => {
    await expect(verifyResetCode({}, form(" 123 456 "))).rejects.toThrow("NEXT_REDIRECT");

    expect(verifyOtp.mock.calls[0][0].token).toBe("123456");
  });

  it("errado, vencido, usado ou substituido devolve a mesma mensagem, sem abrir a flag", async () => {
    verifyOtp.mockResolvedValue({
      data: { session: null },
      error: { code: "otp_expired", status: 403, message: "Token has expired or is invalid" },
    });

    const result = await verifyResetCode({}, form("123456"));

    expect(result).toEqual({ error: "Código inválido ou vencido." });
    expect(setRecoveryFlag).not.toHaveBeenCalled();
  });

  it.each(["12345", "1234567", "abcdef", ""])(
    "codigo mal formado %j devolve a mesma mensagem sem chamar o GoTrue",
    async (code) => {
      expect(await verifyResetCode({}, form(code))).toEqual({ error: "Código inválido ou vencido." });
      expect(verifyOtp).not.toHaveBeenCalled();
    }
  );

  it.each([
    { status: 429, code: undefined },
    { status: 400, code: "over_request_rate_limit" },
  ])("limite de verificacoes ($status/$code) devolve 'Muitas tentativas. Peça um novo código.'", async (error) => {
    verifyOtp.mockResolvedValue({ data: { session: null }, error });

    expect(await verifyResetCode({}, form("123456"))).toEqual({
      error: "Muitas tentativas. Peça um novo código.",
    });
  });

  it("sem cookie de contexto volta a /esqueci-senha", async () => {
    readAuthContext.mockResolvedValue(null);

    await expect(verifyResetCode({}, form("123456"))).rejects.toThrow("NEXT_REDIRECT:/esqueci-senha");
  });

  it("registra auth_reset_codigo_ok e auth_reset_codigo_erro sem PII", async () => {
    await expect(verifyResetCode({}, form("123456"))).rejects.toThrow("NEXT_REDIRECT");
    verifyOtp.mockResolvedValue({ data: { session: null }, error: { status: 403 } });
    await verifyResetCode({}, form("123456"));

    expect(trackEvent).toHaveBeenNthCalledWith(1, { type: "auth_reset_codigo_ok", payload: {} });
    expect(trackEvent).toHaveBeenNthCalledWith(2, { type: "auth_reset_codigo_erro", payload: {} });
  });
});

describe("resendResetCode (AUTH-08 critério 7, AUTH-09)", () => {
  it("reenvia para o e-mail do cookie e devolve sent com cooldown de 60 s", async () => {
    expect(await resendResetCode()).toEqual({ sent: true, retryAfterSec: 60 });
    expect(resetPasswordForEmail).toHaveBeenCalledWith("foo@bar.com");
    expect(checkAndRecordSend).toHaveBeenCalledWith("foo@bar.com", "reset");
  });

  it("dentro do cooldown nao reenvia e devolve a espera", async () => {
    checkAndRecordSend.mockResolvedValue({ allowed: false, reason: "cooldown", retryAfterSec: 33 });

    expect(await resendResetCode()).toEqual({
      error: "Aguarde 33 s para pedir de novo.",
      retryAfterSec: 33,
    });
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("limite de reenvio do GoTrue nao vaza a conta: devolve o mesmo resultado de um envio", async () => {
    resetPasswordForEmail.mockResolvedValueOnce({ error: { code: "over_email_send_rate_limit", status: 429 } });

    expect(await resendResetCode()).toEqual({ sent: true, retryAfterSec: 60 });
  });

  it("falha de envio devolve a mensagem generica", async () => {
    resetPasswordForEmail.mockResolvedValueOnce({ error: { status: 500, message: "smtp" } });

    expect((await resendResetCode()).error).toBe("Não foi possível enviar o e-mail. Tente de novo.");
  });

  it("sem cookie de contexto volta a /esqueci-senha", async () => {
    readAuthContext.mockResolvedValue(null);

    await expect(resendResetCode()).rejects.toThrow("NEXT_REDIRECT:/esqueci-senha");
  });
});
