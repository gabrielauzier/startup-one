import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
const createServerClientMock = vi.fn().mockResolvedValue({
  auth: { getUser: getUserMock },
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));

const businessSingleMock = vi.fn();
const revisionsInsertMock = vi.fn().mockResolvedValue({ error: null });
const cnpjUpdateEqMock = vi.fn().mockResolvedValue({ error: null });

// CA-14.1 (Fix A, rodada 2): usados so' quando business.status ===
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
        eq: () => ({
          // saveDraftPart usa so' .eq().maybeSingle(); getActiveBusinessForOwner
          // encadeia .not().order().limit().maybeSingle() - o mock cobre as duas.
          maybeSingle: businessSingleMock,
          not: () => ({
            order: () => ({
              limit: () => ({ maybeSingle: businessSingleMock }),
            }),
          }),
        }),
      }),
      // CA-05.3: reserva o CNPJ na Parte 1 - update({cnpj}).eq(id).
      update: () => ({ eq: cnpjUpdateEqMock }),
    };
  }
  if (table === "business_revisions") {
    return {
      insert: revisionsInsertMock,
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

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: fromMock })),
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

const VALID_CNPJ = "11444777000161";

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  businessSingleMock.mockResolvedValue({
    data: { id: "biz-1", owner_id: "user-1" },
  });
  revisionsInsertMock.mockResolvedValue({ error: null });
  cnpjUpdateEqMock.mockResolvedValue({ error: null });
  revisionsSelectResult = { data: [] };
  verificationsSelectResult = { data: null };
});

describe("submitParte1 (RF-06, RN-03, RN-05)", () => {
  it("rejeita CNPJ com digito verificador invalido (CA-05.1)", async () => {
    const { submitParte1 } = await import("../actions");

    const result = await submitParte1(
      {},
      formData({
        nome: "Raimunda",
        telefone: "9199999999",
        cnpj: "11444777000162",
        autorizacao: "on",
      })
    );

    expect(result).toEqual({ error: "CNPJ inválido", field: "cnpj" });
    expect(revisionsInsertMock).not.toHaveBeenCalled();
  });

  it("bloqueia o avanco sem a autorizacao marcada (CA-03.1)", async () => {
    const { submitParte1 } = await import("../actions");

    const result = await submitParte1(
      {},
      formData({ nome: "Raimunda", telefone: "9199999999", cnpj: VALID_CNPJ })
    );

    expect(result.field).toBe("autorizacao");
    expect(revisionsInsertMock).not.toHaveBeenCalled();
  });

  it("exige nome e telefone", async () => {
    const { submitParte1 } = await import("../actions");

    const semNome = await submitParte1(
      {},
      formData({ telefone: "9199999999", cnpj: VALID_CNPJ, autorizacao: "on" })
    );
    expect(semNome.field).toBe("nome");

    const semTelefone = await submitParte1(
      {},
      formData({ nome: "Raimunda", cnpj: VALID_CNPJ, autorizacao: "on" })
    );
    expect(semTelefone.field).toBe("telefone");
  });

  it("salva a parte e redireciona para a parte 2 quando tudo e valido", async () => {
    const { submitParte1 } = await import("../actions");

    await expect(
      submitParte1(
        {},
        formData({
          nome: "Raimunda",
          telefone: "9199999999",
          cnpj: VALID_CNPJ,
          autorizacao: "on",
        })
      )
    ).rejects.toThrow("REDIRECT:/produtor/cadastro/2");

    expect(revisionsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: "biz-1",
        status: "rascunho",
      })
    );
  });

  it("CNPJ ja' em uso por outro cadastro (indice unico) devolve mensagem clara (CA-05.3)", async () => {
    cnpjUpdateEqMock.mockResolvedValue({ error: { code: "23505" } });

    const { submitParte1 } = await import("../actions");

    const result = await submitParte1(
      {},
      formData({
        nome: "Raimunda",
        telefone: "9199999999",
        cnpj: VALID_CNPJ,
        autorizacao: "on",
      })
    );

    expect(result).toEqual({
      error: "Este CNPJ já está em uso por outro cadastro em andamento ou verificado.",
      field: "cnpj",
    });
    expect(revisionsInsertMock).not.toHaveBeenCalled();
  });

  // CA-14.1 (Fix A, rodada 2 do Verifier): em ajuste_solicitado, o CNPJ
  // so' pode mudar se o verificador marcou "parte1.cnpj". Um valor
  // diferente postado para o campo travado (adulterado ou nao) nunca
  // deve sobrescrever a coluna `businesses.cnpj`.
  it("ajuste_solicitado sem 'parte1.cnpj' marcado: ignora o CNPJ postado e nao regrava a coluna", async () => {
    businessSingleMock.mockResolvedValue({
      data: { id: "biz-1", owner_id: "user-1", status: "ajuste_solicitado" },
    });
    verificationsSelectResult = {
      data: { itens_ajuste: [{ campo: "parte1.nome", comentario: "Corrija o nome" }] },
    };
    revisionsSelectResult = {
      data: [
        {
          dados: {
            part: 1,
            nome: "Nome Antigo",
            telefone: "9199999999",
            email: "",
            cnpj: VALID_CNPJ,
            autorizacao: true,
          },
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    };

    const { submitParte1 } = await import("../actions");

    const outroCnpjValido = "11222333000181";

    await expect(
      submitParte1(
        {},
        formData({
          nome: "Nome Corrigido",
          telefone: "9199999999",
          cnpj: outroCnpjValido,
          autorizacao: "on",
        })
      )
    ).rejects.toThrow("REDIRECT:/produtor/cadastro/2");

    // A coluna businesses.cnpj nao e' regravada com o valor adulterado.
    expect(cnpjUpdateEqMock).not.toHaveBeenCalled();
    // O rascunho mantem o CNPJ original (mesclado por saveDraftPart a
    // partir do que ja' estava salvo), nao o postado.
    expect(revisionsInsertMock).toHaveBeenCalledWith({
      business_id: "biz-1",
      dados: {
        part: 1,
        nome: "Nome Corrigido",
        telefone: "9199999999",
        email: "",
        cnpj: VALID_CNPJ,
        autorizacao: true,
      },
      status: "rascunho",
    });
  });
});
