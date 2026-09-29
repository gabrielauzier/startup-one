import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
const createServerClientMock = vi.fn().mockResolvedValue({
  auth: { getUser: getUserMock },
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));

let businessResult: {
  data: { id: string; owner_id: string; status?: string } | null;
} = {
  data: { id: "biz-1", owner_id: "user-123" },
};
const insertMock = vi.fn().mockResolvedValue({ error: null });

// CA-14.1 (Fix A da rodada 2): usados so' quando business.status ===
// "ajuste_solicitado" - getDraftData (business_revisions.select) e
// getLatestItensAjuste (verifications.select).
let revisionsSelectResult: { data: Array<{ dados: unknown; created_at: string }> } = {
  data: [],
};
let verificationsSelectResult: {
  data: { itens_ajuste: Array<{ campo: string; comentario: string }> } | null;
} = { data: null };

const fromMock = vi.fn((table: string) => {
  if (table === "businesses") {
    return {
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve(businessResult) }),
      }),
    };
  }
  if (table === "business_revisions") {
    return {
      insert: insertMock,
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve(revisionsSelectResult),
        }),
      }),
    };
  }
  if (table === "verifications") {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                maybeSingle: () => Promise.resolve(verificationsSelectResult),
              }),
            }),
          }),
        }),
      }),
    };
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
  revisionsSelectResult = { data: [] };
  verificationsSelectResult = { data: null };
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

  // CA-14.1 (Fix A, rodada 2 do Verifier): "ajuste_solicitado" so' pode
  // mudar os campos marcados por itens_ajuste - o servidor nao confia
  // no que o formulario mandou para os demais, mesmo que o client tenha
  // sido adulterado.
  describe("ajuste_solicitado: mescla so' os campos marcados (CA-14.1)", () => {
    beforeEach(() => {
      businessResult = {
        data: { id: "biz-1", owner_id: "user-123", status: "ajuste_solicitado" },
      };
      verificationsSelectResult = {
        data: { itens_ajuste: [{ campo: "parte2.cidade", comentario: "Corrija a cidade" }] },
      };
      revisionsSelectResult = {
        data: [
          {
            dados: {
              part: 2,
              nome: "Nome Original",
              tipoOrg: "cooperativa",
              cidade: "Cidade Antiga",
              uf: "PA",
              familias: 5,
              anosAtividade: 3,
              recebeVisitas: true,
            },
            created_at: "2026-01-01T00:00:00.000Z",
          },
        ],
      };
    });

    it("aplica o campo marcado e ignora os demais campos postados (mesmo adulterados)", async () => {
      const { saveDraftPart } = await import("../actions");

      const result = await saveDraftPart("biz-1", 2, {
        nome: "Nome Adulterado",
        tipoOrg: "associacao",
        cidade: "Cidade Nova",
        uf: "MA",
        familias: 999,
        anosAtividade: 999,
        recebeVisitas: false,
      });

      expect(result).toEqual({ ok: true });
      expect(insertMock).toHaveBeenCalledWith({
        business_id: "biz-1",
        dados: {
          part: 2,
          nome: "Nome Original",
          tipoOrg: "cooperativa",
          cidade: "Cidade Nova",
          uf: "PA",
          familias: 5,
          anosAtividade: 3,
          recebeVisitas: true,
        },
        status: "rascunho",
      });
    });

    it("nao gera erro quando nenhum campo postado esta marcado", async () => {
      const { saveDraftPart } = await import("../actions");

      const result = await saveDraftPart("biz-1", 2, { nome: "Outro nome tentado" });

      expect(result).toEqual({ ok: true });
      expect(insertMock).toHaveBeenCalledWith({
        business_id: "biz-1",
        dados: {
          part: 2,
          nome: "Nome Original",
          tipoOrg: "cooperativa",
          cidade: "Cidade Antiga",
          uf: "PA",
          familias: 5,
          anosAtividade: 3,
          recebeVisitas: true,
        },
        status: "rascunho",
      });
    });
  });
});
