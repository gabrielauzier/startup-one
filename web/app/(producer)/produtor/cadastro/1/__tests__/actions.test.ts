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
    };
  }
  if (table === "business_revisions") {
    return { insert: revisionsInsertMock };
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
});
