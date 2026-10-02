import { describe, it, expect, vi, beforeEach } from "vitest";

const signInWithOtpMock = vi.fn();
const createServerClientMock = vi.fn().mockResolvedValue({
  auth: { signInWithOtp: signInWithOtpMock },
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
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
  signInWithOtpMock.mockResolvedValue({ error: null });
});

describe("sendOtp", () => {
  it("retorna erro quando o e-mail esta vazio, sem chamar o Supabase (CA-01.1)", async () => {
    const { sendOtp } = await import("../actions");

    const result = await sendOtp({}, formData({ email: "", role: "investidor" }));

    expect(result).toEqual({ error: "Informe um e-mail." });
    expect(signInWithOtpMock).not.toHaveBeenCalled();
  });

  it("retorna erro quando nenhum perfil valido foi marcado", async () => {
    const { sendOtp } = await import("../actions");

    const result = await sendOtp(
      {},
      formData({ email: "helena@example.com", role: "" })
    );

    expect(result).toEqual({ error: "Escolha como você usa a Îasy." });
    expect(signInWithOtpMock).not.toHaveBeenCalled();
  });

  it("trata o erro do Supabase sem deixar vazar a mensagem interna", async () => {
    signInWithOtpMock.mockResolvedValue({
      error: { message: "email rate limit exceeded" },
    });
    const { sendOtp } = await import("../actions");

    const result = await sendOtp(
      {},
      formData({ email: "helena@example.com", role: "investidor" })
    );

    expect(result).toEqual({
      error: "Não foi possível enviar o código. Confira o e-mail e tente de novo.",
    });
  });

  it("chama signInWithOtp com o e-mail e o papel, e redireciona para a tela de codigo", async () => {
    const { sendOtp } = await import("../actions");

    await expect(
      sendOtp({}, formData({ email: "helena@example.com", role: "investidor" }))
    ).rejects.toThrow("REDIRECT:/entrar/codigo?email=helena%40example.com&role=investidor");

    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: "helena@example.com",
      options: { data: { role: "investidor" }, shouldCreateUser: true },
    });
  });
});
