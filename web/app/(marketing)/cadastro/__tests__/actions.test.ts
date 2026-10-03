import { describe, it, expect, vi, beforeEach } from "vitest";

const signUp = vi.fn();
const resend = vi.fn();
const rpc = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});
const checkAndRecordSend = vi.fn();
const setAuthContext = vi.fn(async (...a: unknown[]) => void a);
const sendEmail = vi.fn(async (...a: unknown[]) => ({ ok: a.length > 0 }));
const trackEvent = vi.fn(async (...a: unknown[]) => ({ ok: a.length > 0 }));

vi.mock("next/navigation", () => ({ redirect: (p: string) => redirect(p) }));
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({ auth: { signUp, resend } }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));
vi.mock("@/lib/auth/origin", () => ({ requestOrigin: async () => "https://iasy.test" }));
vi.mock("@/lib/auth/throttle", () => ({
  checkAndRecordSend: (...a: unknown[]) => checkAndRecordSend(...a),
}));
vi.mock("@/lib/auth/auth-context-cookie", () => ({
  setAuthContext: (...a: unknown[]) => setAuthContext(...a),
}));
vi.mock("@/lib/notifications/send-email", () => ({ sendEmail: (...a: unknown[]) => sendEmail(...a) }));
vi.mock("@/lib/analytics/track", () => ({ trackEvent: (...a: unknown[]) => trackEvent(...a) }));

import { signUpAction } from "../actions";

const valid = {
  role: "investidor",
  nome: "Helena Souza",
  email: "Helena@Example.com",
  password: "abc12345",
  confirm: "abc12345",
};
const form = (overrides: Partial<typeof valid> = {}) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...valid, ...overrides })) fd.set(k, v);
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
  checkAndRecordSend.mockResolvedValue({ allowed: true });
  rpc.mockResolvedValue({ data: "none" });
  signUp.mockResolvedValue({ data: {}, error: null });
  resend.mockResolvedValue({ error: null });
});

describe("signUpAction: validacao (AUTH-02, critérios 3 a 5)", () => {
  it.each([
    ["7 caracteres", { password: "abc1234", confirm: "abc1234" }, "passwordError", "Use ao menos 8 caracteres."],
    ["sem numero", { password: "somenteletras", confirm: "somenteletras" }, "passwordError", "Inclua ao menos 1 número."],
    ["confirmacao diferente", { confirm: "abc12346" }, "confirmError", "As senhas não são iguais."],
    ["nome curto", { nome: "A" }, "nomeError", "Informe seu nome com 2 a 80 caracteres."],
    ["nome longo", { nome: "x".repeat(81) }, "nomeError", "Informe seu nome com 2 a 80 caracteres."],
    ["e-mail invalido", { email: "sem-arroba" }, "emailError", "Informe um e-mail válido."],
    ["perfil verificador forjado", { role: "verificador" }, "roleError", "Escolha como você usa a Îasy."],
    ["perfil vazio", { role: "" }, "roleError", "Escolha como você usa a Îasy."],
  ] as const)("%s bloqueia sem chamar Supabase nem throttle", async (_n, override, field, message) => {
    const result = await signUpAction({}, form(override));

    expect(result[field]).toBe(message);
    expect(signUp).not.toHaveBeenCalled();
    expect(checkAndRecordSend).not.toHaveBeenCalled();
  });

  it("devolve o que foi digitado, sem a senha", async () => {
    const result = await signUpAction({}, form({ nome: "A" }));

    expect(result.values).toEqual({ role: "investidor", nome: "A", email: "helena@example.com" });
    expect(JSON.stringify(result)).not.toContain("abc12345");
  });
});

describe("signUpAction: e-mail novo (AUTH-03, critério 6)", () => {
  it("chama signUp com role, nome e has_password, grava o contexto e redireciona sem e-mail na URL", async () => {
    await expect(signUpAction({}, form())).rejects.toThrow("NEXT_REDIRECT:/cadastro/confirmar-email");

    expect(signUp).toHaveBeenCalledWith({
      email: "helena@example.com",
      password: "abc12345",
      options: { data: { role: "investidor", nome: "Helena Souza", has_password: true } },
    });
    expect(setAuthContext).toHaveBeenCalledWith({ email: "helena@example.com", kind: "signup" });
    expect(checkAndRecordSend).toHaveBeenCalledWith("helena@example.com", "signup");
    expect(rpc).toHaveBeenCalledWith("email_account_status", { p_email: "helena@example.com" });
  });

  it("registra auth_cadastro_enviado so com o papel no payload (sem e-mail)", async () => {
    await expect(signUpAction({}, form())).rejects.toThrow("NEXT_REDIRECT");

    expect(trackEvent).toHaveBeenCalledWith({
      type: "auth_cadastro_enviado",
      payload: { papel: "investidor" },
    });
  });

  it("falha no evento nao impede o cadastro", async () => {
    trackEvent.mockRejectedValueOnce(new Error("boom"));

    await expect(signUpAction({}, form())).rejects.toThrow("NEXT_REDIRECT:/cadastro/confirmar-email");
  });

  it("erro do banco/GoTrue no signUp devolve mensagem generica", async () => {
    signUp.mockResolvedValueOnce({
      data: {},
      error: { code: "unexpected_failure", status: 500, message: "Database error saving new user" },
    });

    const result = await signUpAction({}, form());

    expect(result.error).toBe("Não foi possível criar a conta. Tente de novo.");
    expect(JSON.stringify(result)).not.toContain("Database");
    expect(setAuthContext).not.toHaveBeenCalled();
  });

  it("user_already_exists numa corrida segue como sucesso", async () => {
    signUp.mockResolvedValueOnce({ data: {}, error: { code: "user_already_exists", status: 422 } });

    await expect(signUpAction({}, form())).rejects.toThrow("NEXT_REDIRECT:/cadastro/confirmar-email");
  });
});

describe("signUpAction: e-mail ja existente (AUTH-03, critérios 7, 7a, 7b)", () => {
  it("confirmado: mesma tela de sucesso, nao chama signUp e envia o aviso ao titular", async () => {
    rpc.mockResolvedValue({ data: "confirmed" });

    await expect(signUpAction({}, form())).rejects.toThrow("NEXT_REDIRECT:/cadastro/confirmar-email");

    expect(signUp).not.toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const mail = sendEmail.mock.calls[0][0] as { to: string; body: string };
    expect(mail.to).toBe("helena@example.com");
    expect(mail.body).toContain("https://iasy.test/entrar");
    expect(mail.body).toContain("Esqueci minha senha");
  });

  it("nao confirmado: reenvia a confirmacao (type=signup) e nao chama signUp", async () => {
    rpc.mockResolvedValue({ data: "unconfirmed" });

    await expect(signUpAction({}, form())).rejects.toThrow("NEXT_REDIRECT:/cadastro/confirmar-email");

    expect(resend).toHaveBeenCalledWith({ type: "signup", email: "helena@example.com" });
    expect(signUp).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("os tres caminhos terminam no mesmo destino e gravam o mesmo contexto", async () => {
    const destinations: string[] = [];
    for (const status of ["none", "confirmed", "unconfirmed"]) {
      rpc.mockResolvedValue({ data: status });
      try {
        await signUpAction({}, form());
      } catch (e) {
        destinations.push((e as Error).message);
      }
    }

    expect(new Set(destinations)).toEqual(new Set(["NEXT_REDIRECT:/cadastro/confirmar-email"]));
    expect(setAuthContext).toHaveBeenCalledTimes(3);
  });
});

describe("signUpAction: throttle e falha de envio (AUTH-09)", () => {
  it("bloqueado pelo throttle devolve a mensagem de espera e nao cria usuario", async () => {
    checkAndRecordSend.mockResolvedValueOnce({ allowed: false, reason: "cooldown", retryAfterSec: 30 });

    const result = await signUpAction({}, form());

    expect(result.error).toBe("Aguarde 30 s para pedir de novo.");
    expect(signUp).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("falha ao reenviar a confirmacao devolve a mensagem generica de envio", async () => {
    rpc.mockResolvedValue({ data: "unconfirmed" });
    resend.mockResolvedValueOnce({ error: { status: 500, message: "smtp down" } });

    const result = await signUpAction({}, form());

    expect(result.error).toBe("Não foi possível enviar o e-mail. Tente de novo.");
    expect(JSON.stringify(result)).not.toContain("smtp");
  });
});
