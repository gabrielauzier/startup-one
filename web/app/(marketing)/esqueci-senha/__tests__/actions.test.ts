import { describe, it, expect, vi, beforeEach } from "vitest";

const resetPasswordForEmail = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
const checkAndRecordSend = vi.fn();
const setAuthContext = vi.fn(async (...a: unknown[]) => void a);
const trackEvent = vi.fn(async (...a: unknown[]) => ({ ok: a.length > 0 }));

vi.mock("next/navigation", () => ({ redirect: (p: string) => redirect(p) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({ auth: { resetPasswordForEmail } }),
}));
vi.mock("@/lib/auth/throttle", () => ({
  checkAndRecordSend: (...a: unknown[]) => checkAndRecordSend(...a),
}));
vi.mock("@/lib/auth/auth-context-cookie", () => ({
  setAuthContext: (...a: unknown[]) => setAuthContext(...a),
}));
vi.mock("@/lib/analytics/track", () => ({ trackEvent: (...a: unknown[]) => trackEvent(...a) }));

import { requestReset } from "../actions";

const form = (email: string) => {
  const fd = new FormData();
  fd.set("email", email);
  return fd;
};

const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

beforeEach(() => {
  vi.clearAllMocks();
  checkAndRecordSend.mockResolvedValue({ allowed: true });
  resetPasswordForEmail.mockResolvedValue({ error: null });
});

describe("requestReset (AUTH-08, critérios 1 e 3)", () => {
  it("chama resetPasswordForEmail com o e-mail normalizado, grava o contexto e redireciona ao codigo", async () => {
    await expect(requestReset({}, form(" Foo@Bar.com "))).rejects.toThrow(
      "NEXT_REDIRECT:/esqueci-senha/codigo"
    );

    expect(resetPasswordForEmail).toHaveBeenCalledWith("foo@bar.com");
    expect(setAuthContext).toHaveBeenCalledWith({ email: "foo@bar.com", kind: "reset" });
    expect(checkAndRecordSend).toHaveBeenCalledWith("foo@bar.com", "reset");
  });

  it("e-mail com e sem conta recebem exatamente o mesmo resultado (o GoTrue nao distingue)", async () => {
    const outcomes: string[] = [];
    for (const email of ["existe@b.com", "naoexiste@b.com"]) {
      try {
        await requestReset({}, form(email));
      } catch (e) {
        outcomes.push((e as Error).message);
      }
    }

    expect(outcomes).toEqual([
      "NEXT_REDIRECT:/esqueci-senha/codigo",
      "NEXT_REDIRECT:/esqueci-senha/codigo",
    ]);
  });

  it("throttle bloqueado devolve a mesma mensagem para qualquer e-mail e nao chama o GoTrue", async () => {
    checkAndRecordSend.mockResolvedValue({ allowed: false, reason: "cooldown", retryAfterSec: 25 });

    const a = await requestReset({}, form("existe@b.com"));
    const b = await requestReset({}, form("naoexiste@b.com"));

    expect(a).toEqual({ error: "Aguarde 25 s para pedir de novo." });
    expect(b).toEqual(a);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("e-mail invalido nao chama throttle nem GoTrue", async () => {
    expect(await requestReset({}, form("sem-arroba"))).toEqual({ error: "Informe um e-mail válido." });
    expect(checkAndRecordSend).not.toHaveBeenCalled();
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("falha de envio devolve a mensagem generica e nao grava o contexto", async () => {
    resetPasswordForEmail.mockResolvedValueOnce({ error: { status: 500, message: "smtp down" } });

    const result = await requestReset({}, form("a@b.com"));

    expect(result).toEqual({ error: "Não foi possível enviar o e-mail. Tente de novo." });
    expect(setAuthContext).not.toHaveBeenCalled();
    expect(errorLog).toHaveBeenCalledWith("[auth] reset.resetPasswordForEmail", {
      code: undefined,
      status: 500,
    });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain("smtp");
  });

  it("limite de reenvio do GoTrue (so' existe para conta existente) e tratado como envio normal, sem vazar a conta", async () => {
    resetPasswordForEmail.mockResolvedValueOnce({
      error: { code: "over_email_send_rate_limit", status: 429, message: "after 60 seconds" },
    });

    await expect(requestReset({}, form("existe@b.com"))).rejects.toThrow(
      "NEXT_REDIRECT:/esqueci-senha/codigo"
    );
  });

  it("registra auth_reset_pedido sem PII; falha do evento nao impede o fluxo", async () => {
    await expect(requestReset({}, form("a@b.com"))).rejects.toThrow("NEXT_REDIRECT");
    expect(trackEvent).toHaveBeenCalledWith({ type: "auth_reset_pedido", payload: {} });

    trackEvent.mockRejectedValueOnce(new Error("boom"));
    await expect(requestReset({}, form("a@b.com"))).rejects.toThrow(
      "NEXT_REDIRECT:/esqueci-senha/codigo"
    );
  });
});
