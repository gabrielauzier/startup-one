import { describe, it, expect, vi, beforeEach } from "vitest";

let draftsResult: {
  data:
    | { id: string; created_at: string; owner_id?: string; nome?: string }[]
    | null;
  error: unknown;
} = { data: [], error: null };
let lastRevisionByBusiness: Record<string, string | null> = {};
const deleteInMock = vi.fn().mockResolvedValue({ error: null });
const enqueueNotificationMock = vi.fn().mockResolvedValue({ ok: true });
// Gap 3 (rodada 2): por padrao, "nunca avisado ainda" - o teste de
// dedup fica no `daily`, que orquestra o mesmo helper; aqui so' precisa
// nao quebrar a rota com a nova dependencia.
const wasNearingExpiryNotifiedMock = vi.fn().mockResolvedValue(false);

vi.mock("@/lib/notifications/queue", () => ({
  enqueueNotification: enqueueNotificationMock,
  wasNearingExpiryNotified: wasNearingExpiryNotifiedMock,
}));

const fromMock = vi.fn((table: string) => {
  if (table === "businesses") {
    return {
      select: () => ({
        eq: () => Promise.resolve(draftsResult),
      }),
      delete: () => ({ in: deleteInMock }),
    };
  }
  if (table === "business_revisions") {
    return {
      select: () => ({
        eq: (_col: string, businessId: string) => ({
          order: () => ({
            limit: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: lastRevisionByBusiness[businessId]
                    ? { created_at: lastRevisionByBusiness[businessId] }
                    : null,
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
  process.env.CRON_SECRET = "segredo-de-teste";
  draftsResult = { data: [], error: null };
  lastRevisionByBusiness = {};
  deleteInMock.mockResolvedValue({ error: null });
  enqueueNotificationMock.mockResolvedValue({ ok: true });
});

function request(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/cron/expire-drafts", {
    method: "POST",
    headers,
  });
}

const NOW = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

describe("POST /api/cron/expire-drafts (RN-07/CA-07.3)", () => {
  it("retorna 401 sem o header do segredo", async () => {
    const { POST } = await import("../route");
    const res = await POST(request());
    expect(res.status).toBe(401);
  });

  it("retorna 401 com o segredo errado", async () => {
    const { POST } = await import("../route");
    const res = await POST(request({ "x-cron-secret": "errado" }));
    expect(res.status).toBe(401);
  });

  it("apaga rascunhos sem nenhuma revisao ha mais de 90 dias (usa created_at do negocio)", async () => {
    draftsResult = {
      data: [
        { id: "biz-velho", created_at: new Date(NOW - 91 * DAY_MS).toISOString() },
      ],
      error: null,
    };
    const { POST } = await import("../route");

    const res = await POST(request({ "x-cron-secret": "segredo-de-teste" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, expired: 1, avisados: 0 });
    expect(deleteInMock).toHaveBeenCalledWith("id", ["biz-velho"]);
  });

  it("nao apaga um rascunho com atividade recente em business_revisions", async () => {
    draftsResult = {
      data: [
        { id: "biz-ativo", created_at: new Date(NOW - 200 * DAY_MS).toISOString() },
      ],
      error: null,
    };
    lastRevisionByBusiness["biz-ativo"] = new Date(NOW - 1 * DAY_MS).toISOString();
    const { POST } = await import("../route");

    const res = await POST(request({ "x-cron-secret": "segredo-de-teste" }));

    const body = await res.json();
    expect(body).toEqual({ ok: true, expired: 0, avisados: 0 });
    expect(deleteInMock).not.toHaveBeenCalled();
  });

  it("nao apaga um rascunho criado ha menos de 90 dias", async () => {
    draftsResult = {
      data: [
        { id: "biz-novo", created_at: new Date(NOW - 10 * DAY_MS).toISOString() },
      ],
      error: null,
    };
    const { POST } = await import("../route");

    const res = await POST(request({ "x-cron-secret": "segredo-de-teste" }));

    const body = await res.json();
    expect(body).toEqual({ ok: true, expired: 0, avisados: 0 });
    expect(deleteInMock).not.toHaveBeenCalled();
  });

  it("avisa (CA-07.3) um rascunho com 85 dias de inatividade, sem apagar (Fix 5, rodada 1 do Verifier)", async () => {
    draftsResult = {
      data: [
        {
          id: "biz-quase-expirando",
          created_at: new Date(NOW - 85 * DAY_MS).toISOString(),
          owner_id: "owner-1",
          nome: "Cooperativa Teste",
        },
      ],
      error: null,
    };
    const { POST } = await import("../route");

    const res = await POST(request({ "x-cron-secret": "segredo-de-teste" }));
    const body = await res.json();

    expect(body).toEqual({ ok: true, expired: 0, avisados: 1 });
    expect(deleteInMock).not.toHaveBeenCalled();
    expect(enqueueNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "rascunho_expirando_em_breve",
        destinatarioId: "owner-1",
        payload: expect.objectContaining({ businessId: "biz-quase-expirando" }),
      })
    );
  });

  // Gap 3 (Minor, rodada 2 do Verifier): sem dedup, um rascunho na
  // janela de 7 dias receberia o aviso todo dia (ate' 7x). Ja avisado
  // nesta janela -> nao enfileira de novo.
  it("nao repete o aviso quando ja foi avisado nesta janela (Gap 3)", async () => {
    wasNearingExpiryNotifiedMock.mockResolvedValueOnce(true);
    draftsResult = {
      data: [
        {
          id: "biz-ja-avisado",
          created_at: new Date(NOW - 85 * DAY_MS).toISOString(),
          owner_id: "owner-1",
          nome: "Cooperativa Teste",
        },
      ],
      error: null,
    };
    const { POST } = await import("../route");

    const res = await POST(request({ "x-cron-secret": "segredo-de-teste" }));
    const body = await res.json();

    expect(body).toEqual({ ok: true, expired: 0, avisados: 0 });
    expect(enqueueNotificationMock).not.toHaveBeenCalled();
  });
});
