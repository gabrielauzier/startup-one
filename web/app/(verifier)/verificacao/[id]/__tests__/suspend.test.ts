import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
const sessionProfileSelectMock = vi.fn();
const createServerClientMock = vi.fn().mockResolvedValue({
  auth: { getUser: getUserMock },
  from: (table: string) => {
    if (table === "profiles") {
      return { select: () => ({ eq: () => ({ maybeSingle: sessionProfileSelectMock }) }) };
    }
    throw new Error(`tabela inesperada no cliente de sessao: ${table}`);
  },
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));

const enqueueNotificationMock = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/lib/notifications/queue", () => ({
  enqueueNotification: enqueueNotificationMock,
}));

let businessResult: {
  data: { id: string; status: string; owner_id: string; nome: string } | null;
} = {
  data: { id: "biz-1", status: "verificado", owner_id: "owner-1", nome: "Negócio Teste" },
};
let interestsResult: { data: { investor_id: string }[] | null } = { data: [] };

const updateMock = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const verificationsInsertMock = vi.fn().mockResolvedValue({ error: null });

const fromMock = vi.fn((table: string) => {
  if (table === "businesses") {
    return {
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve(businessResult) }) }),
      update: updateMock,
    };
  }
  if (table === "verifications") {
    return { insert: verificationsInsertMock };
  }
  if (table === "interests") {
    return {
      select: () => ({
        eq: () => ({
          in: () => Promise.resolve(interestsResult),
        }),
      }),
    };
  }
  throw new Error(`tabela inesperada no cliente admin: ${table}`);
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: fromMock })),
}));

const MOTIVO_VALIDO = "Documento da terra apresentou inconsistência grave na fiscalização.";

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "verifier-1" } } });
  sessionProfileSelectMock.mockResolvedValue({ data: { role: "verificador" } });
  businessResult = {
    data: { id: "biz-1", status: "verificado", owner_id: "owner-1", nome: "Negócio Teste" },
  };
  interestsResult = { data: [] };
  updateMock.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  verificationsInsertMock.mockResolvedValue({ error: null });
  enqueueNotificationMock.mockResolvedValue({ ok: true });
});

describe("suspend (CA-21.1, Fix 5 - rodada 1 do Verifier)", () => {
  it("avisa o produtor da suspensao (suspensao_negocio)", async () => {
    const { suspend } = await import("../actions");

    const result = await suspend("biz-1", MOTIVO_VALIDO);

    expect(result.ok).toBe(true);
    expect(enqueueNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "suspensao_negocio",
        destinatarioId: "owner-1",
        payload: expect.objectContaining({ businessId: "biz-1" }),
      })
    );
  });

  it("avisa cada interessado em aberto (Pendente ou Aceito) com suspensao_negocio_investidor", async () => {
    interestsResult = {
      data: [{ investor_id: "investor-1" }, { investor_id: "investor-2" }],
    };
    const { suspend } = await import("../actions");

    await suspend("biz-1", MOTIVO_VALIDO);

    expect(enqueueNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "suspensao_negocio_investidor",
        destinatarioId: "investor-1",
        payload: expect.objectContaining({ businessId: "biz-1" }),
      })
    );
    expect(enqueueNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "suspensao_negocio_investidor",
        destinatarioId: "investor-2",
        payload: expect.objectContaining({ businessId: "biz-1" }),
      })
    );
  });

  it("nao avisa nenhum investidor quando nao ha interesse Pendente/Aceito em aberto", async () => {
    interestsResult = { data: [] };
    const { suspend } = await import("../actions");

    await suspend("biz-1", MOTIVO_VALIDO);

    const investorCalls = enqueueNotificationMock.mock.calls.filter(
      ([arg]) => arg.type === "suspensao_negocio_investidor"
    );
    expect(investorCalls).toHaveLength(0);
  });
});
