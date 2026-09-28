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
          maybeSingle: businessSingleMock,
          not: () => ({
            order: () => ({ limit: () => ({ maybeSingle: businessSingleMock }) }),
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

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  businessSingleMock.mockResolvedValue({ data: { id: "biz-1", owner_id: "user-1" } });
  revisionsInsertMock.mockResolvedValue({ error: null });
});

const VALID = {
  finalidade: "obras",
  valorBusca: "100000",
  prazoMeses: "24",
  retornoProposto: "14,8",
};

describe("submitParte5 (RF-10, RN-10)", () => {
  it("rejeita valor abaixo do minimo mostrando os limites (CA-10.1)", async () => {
    const { submitParte5 } = await import("../actions");
    const result = await submitParte5({}, formData({ ...VALID, valorBusca: "40000" }));
    expect(result.field).toBe("valorBusca");
    expect(result.error).toContain("R$ 50 mil");
    expect(result.error).toContain("R$ 200 mil");
  });

  it("rejeita valor acima do maximo (CA-10.1)", async () => {
    const { submitParte5 } = await import("../actions");
    const result = await submitParte5({}, formData({ ...VALID, valorBusca: "250000" }));
    expect(result.field).toBe("valorBusca");
  });

  it("rejeita valor fora do passo de R$5 mil", async () => {
    const { submitParte5 } = await import("../actions");
    const result = await submitParte5({}, formData({ ...VALID, valorBusca: "101000" }));
    expect(result.field).toBe("valorBusca");
  });

  it("rejeita prazo fora de {12,18,24,36}", async () => {
    const { submitParte5 } = await import("../actions");
    const result = await submitParte5({}, formData({ ...VALID, prazoMeses: "20" }));
    expect(result.field).toBe("prazoMeses");
  });

  it("rejeita retorno fora de 0-30%", async () => {
    const { submitParte5 } = await import("../actions");
    const result = await submitParte5({}, formData({ ...VALID, retornoProposto: "35" }));
    expect(result.field).toBe("retornoProposto");
  });

  it("persiste o retorno 14,8 com 1 casa decimal e redireciona para revisar (CA-10.2)", async () => {
    const { submitParte5 } = await import("../actions");

    await expect(submitParte5({}, formData(VALID))).rejects.toThrow(
      "REDIRECT:/produtor/cadastro/revisar"
    );

    expect(revisionsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: "biz-1",
        dados: expect.objectContaining({ part: 5, retornoProposto: 14.8 }),
      })
    );
  });
});
