import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
const createServerClientMock = vi.fn().mockResolvedValue({
  auth: { getUser: getUserMock },
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));

let businessResult: { data: { id: string; owner_id: string } | null } = {
  data: { id: "biz-1", owner_id: "user-123" },
};
const insertMock = vi.fn().mockResolvedValue({ error: null });

const fromMock = vi.fn((table: string) => {
  if (table === "businesses") {
    return {
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve(businessResult) }),
      }),
    };
  }
  if (table === "business_revisions") {
    return { insert: insertMock };
  }
  throw new Error(`tabela inesperada no mock: ${table}`);
});
const createAdminClientMock = vi.fn().mockReturnValue({ from: fromMock });

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "user-123" } } });
  businessResult = { data: { id: "biz-1", owner_id: "user-123" } };
  insertMock.mockResolvedValue({ error: null });
});

describe("saveDraftPart (RF-11)", () => {
  it("recusa sem sessao", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const { saveDraftPart } = await import("../actions");

    const result = await saveDraftPart("biz-1", 1, { nome: "Raimunda" });

    expect(result).toEqual({
      ok: false,
      error: "Sessão expirada. Entre novamente.",
    });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("recusa quando o negocio nao existe ou nao pertence ao usuario", async () => {
    businessResult = { data: null };
    const { saveDraftPart } = await import("../actions");

    const result = await saveDraftPart("biz-outro", 1, { nome: "Raimunda" });

    expect(result).toEqual({ ok: false, error: "Cadastro não encontrado." });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("recusa quando o negocio pertence a outro usuario", async () => {
    businessResult = { data: { id: "biz-1", owner_id: "outro-user" } };
    const { saveDraftPart } = await import("../actions");

    const result = await saveDraftPart("biz-1", 1, { nome: "Raimunda" });

    expect(result.ok).toBe(false);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("grava a parte em business_revisions com status rascunho", async () => {
    const { saveDraftPart } = await import("../actions");

    const result = await saveDraftPart("biz-1", 2, { cidade: "Cametá" });

    expect(result).toEqual({ ok: true });
    expect(fromMock).toHaveBeenCalledWith("business_revisions");
    expect(insertMock).toHaveBeenCalledWith({
      business_id: "biz-1",
      dados: { part: 2, cidade: "Cametá" },
      status: "rascunho",
    });
  });

  it("retorna erro tratado quando a gravacao falha", async () => {
    insertMock.mockResolvedValue({ error: { message: "db down" } });
    const { saveDraftPart } = await import("../actions");

    const result = await saveDraftPart("biz-1", 1, { nome: "Raimunda" });

    expect(result).toEqual({
      ok: false,
      error: "Não foi possível salvar. Tente de novo.",
    });
  });
});
