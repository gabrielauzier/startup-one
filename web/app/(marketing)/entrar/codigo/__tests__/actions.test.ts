import { describe, it, expect, vi, beforeEach } from "vitest";

const verifyOtpMock = vi.fn();
const createServerClientMock = vi.fn().mockResolvedValue({
  auth: { verifyOtp: verifyOtpMock },
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));

const upsertMock = vi.fn().mockResolvedValue({ error: null });

// Estado configuravel por teste: o que "profiles.select('role')",
// "businesses" e "investor_answers" devem responder no admin fake.
let profileRoleResult: { data: { role: string } | null } = {
  data: { role: "investidor" },
};
let businessesResult: { data: { id: string } | null } = { data: null };
let investorAnswersResult: { data: { investor_id: string } | null } = {
  data: null,
};

function selectChain(result: unknown) {
  return { eq: () => ({ single: () => Promise.resolve(result), maybeSingle: () => Promise.resolve(result) }) };
}

const fromMock = vi.fn((table: string) => {
  if (table === "profiles") {
    return { upsert: upsertMock, select: () => selectChain(profileRoleResult) };
  }
  if (table === "businesses") {
    return { select: () => selectChain(businessesResult) };
  }
  if (table === "investor_answers") {
    return { select: () => selectChain(investorAnswersResult) };
  }
  throw new Error(`tabela inesperada no mock: ${table}`);
});
const createAdminClientMock = vi.fn().mockReturnValue({ from: fromMock });

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
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
  upsertMock.mockResolvedValue({ error: null });
  profileRoleResult = { data: { role: "investidor" } };
  businessesResult = { data: null };
  investorAnswersResult = { data: null };
});

describe("verifyOtp", () => {
  it("bloqueia sem chamar o Supabase quando ja atingiu 5 tentativas (CA-02.1)", async () => {
    const { verifyOtp } = await import("../../actions");

    const result = await verifyOtp(
      { attempts: 5 },
      formData({ email: "helena@example.com", role: "investidor", code: "111111" })
    );

    expect(result).toEqual({
      attempts: 5,
      error: "Você tentou muitas vezes. Peça um novo código.",
    });
    expect(verifyOtpMock).not.toHaveBeenCalled();
  });

  it("incrementa as tentativas a cada codigo errado", async () => {
    verifyOtpMock.mockResolvedValue({
      data: { user: null },
      error: { message: "Token has expired or is invalid" },
    });
    const { verifyOtp } = await import("../../actions");

    const result = await verifyOtp(
      { attempts: 2 },
      formData({ email: "helena@example.com", role: "investidor", code: "000000" })
    );

    expect(result).toEqual({ attempts: 3, error: "Código inválido ou vencido." });
  });

  it("na 5a tentativa errada, marca attempts=5 (proxima chamada fica bloqueada)", async () => {
    verifyOtpMock.mockResolvedValue({
      data: { user: null },
      error: { message: "Token has expired or is invalid" },
    });
    const { verifyOtp } = await import("../../actions");

    const result = await verifyOtp(
      { attempts: 4 },
      formData({ email: "helena@example.com", role: "investidor", code: "000000" })
    );

    expect(result.attempts).toBe(5);
  });

  it("cria o profile com o papel escolhido na primeira confirmacao de um e-mail sem conta (CA-02.2)", async () => {
    verifyOtpMock.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    const { verifyOtp } = await import("../../actions");

    await expect(
      verifyOtp(
        { attempts: 0 },
        formData({ email: "helena@example.com", role: "investidor", code: "123456" })
      )
    ).rejects.toThrow("REDIRECT:/descobrir/1");

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(upsertMock).toHaveBeenCalledWith(
      { id: "user-123", role: "investidor", nome: "helena" },
      { onConflict: "id", ignoreDuplicates: true }
    );
  });

  it("depois de confirmar, volta para a URL original em vez do destino por papel (CA-02.3)", async () => {
    verifyOtpMock.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    const { verifyOtp } = await import("../../actions");

    await expect(
      verifyOtp(
        { attempts: 0 },
        formData({
          email: "helena@example.com",
          role: "investidor",
          code: "123456",
          redirect: "/negocios/coop-acai-mujuu/documentos",
        })
      )
    ).rejects.toThrow("REDIRECT:/negocios/coop-acai-mujuu/documentos");
  });

  it("ignora um redirect inseguro (URL externa) e usa o destino por papel", async () => {
    verifyOtpMock.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    const { verifyOtp } = await import("../../actions");

    await expect(
      verifyOtp(
        { attempts: 0 },
        formData({
          email: "helena@example.com",
          role: "investidor",
          code: "123456",
          redirect: "https://evil.com",
        })
      )
    ).rejects.toThrow("REDIRECT:/descobrir/1");
  });
});
