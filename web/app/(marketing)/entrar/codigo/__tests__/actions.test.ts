import { describe, it, expect, vi, beforeEach } from "vitest";

function selectChain(result: unknown) {
  return {
    eq: () => ({
      single: () => Promise.resolve(result),
      maybeSingle: () => Promise.resolve(result),
    }),
  };
}

const verifyOtpMock = vi.fn();
const upsertMock = vi.fn().mockResolvedValue({ error: null });

// Estado configuravel por teste: o que "profiles.select('role')" deve
// responder no cliente com a sessao do usuario. termos_aceitos_em ja'
// vem preenchido por padrao para nao acoplar os testes de CA-02.2/
// CA-02.3 ao gate de termos do T11 (esse tem seus proprios testes
// dedicados mais abaixo).
let profileRoleResult: {
  data: { role: string; termos_aceitos_em: string | null } | null;
} = {
  data: { role: "investidor", termos_aceitos_em: "2026-01-01T00:00:00Z" },
};

const sessionFromMock = vi.fn(() => ({
  upsert: upsertMock,
  select: () => selectChain(profileRoleResult),
}));

const createServerClientMock = vi.fn().mockResolvedValue({
  auth: { verifyOtp: verifyOtpMock },
  from: sessionFromMock,
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));

// "businesses" e "investor_answers" (resolvePostLoginRedirect) seguem
// vindo do cliente admin - essas tabelas ainda nao tem RLS propria.
let businessesResult: { data: { id: string } | null } = { data: null };
let investorAnswersResult: { data: { investor_id: string } | null } = {
  data: null,
};

const adminFromMock = vi.fn((table: string) => {
  if (table === "businesses") {
    return { select: () => selectChain(businessesResult) };
  }
  if (table === "investor_answers") {
    return { select: () => selectChain(investorAnswersResult) };
  }
  throw new Error(`tabela inesperada no mock admin: ${table}`);
});
const createAdminClientMock = vi.fn().mockReturnValue({ from: adminFromMock });

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
  profileRoleResult = {
    data: { role: "investidor", termos_aceitos_em: "2026-01-01T00:00:00Z" },
  };
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

    expect(sessionFromMock).toHaveBeenCalledWith("profiles");
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

  it("investidor sem termos aceitos e' levado a /termos antes de qualquer outro destino (RF-04)", async () => {
    verifyOtpMock.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    profileRoleResult = {
      data: { role: "investidor", termos_aceitos_em: null },
    };
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
    ).rejects.toThrow(
      "REDIRECT:/termos?redirect=%2Fnegocios%2Fcoop-acai-mujuu%2Fdocumentos"
    );
  });

  it("produtor nunca e' mandado para /termos, mesmo sem termos_aceitos_em (o aceite dele e' o checkbox da parte 1)", async () => {
    verifyOtpMock.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    profileRoleResult = {
      data: { role: "produtor", termos_aceitos_em: null },
    };
    const { verifyOtp } = await import("../../actions");

    await expect(
      verifyOtp(
        { attempts: 0 },
        formData({ email: "raimunda@example.com", role: "produtor", code: "123456" })
      )
    ).rejects.toThrow("REDIRECT:/produtor");
  });
});
