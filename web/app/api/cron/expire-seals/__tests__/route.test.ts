import { describe, it, expect, vi, beforeEach } from "vitest";

let businessesResult: {
  data:
    | {
        id: string;
        selo_valido_ate: string | null;
        owner_id?: string;
        nome?: string;
      }[]
    | null;
  error: unknown;
} = { data: [], error: null };
const updateInMock = vi.fn().mockResolvedValue({ error: null });
const enqueueNotificationMock = vi.fn().mockResolvedValue({ ok: true });
// Gap 3 (rodada 2): por padrao, "nunca avisado ainda".
const wasNearingExpiryNotifiedMock = vi.fn().mockResolvedValue(false);

vi.mock("@/lib/notifications/queue", () => ({
  enqueueNotification: enqueueNotificationMock,
  wasNearingExpiryNotified: wasNearingExpiryNotifiedMock,
}));

const fromMock = vi.fn((table: string) => {
  if (table === "businesses") {
    return {
      select: () => ({
        eq: () => Promise.resolve(businessesResult),
      }),
      update: () => ({ in: updateInMock }),
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
  businessesResult = { data: [], error: null };
  updateInMock.mockResolvedValue({ error: null });
  enqueueNotificationMock.mockResolvedValue({ ok: true });
});

function request(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/cron/expire-seals", {
    method: "POST",
    headers,
  });
}

describe("POST /api/cron/expire-seals (RN-19/CA-19.2)", () => {
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

  it("expira um selo concedido em 01/10/2026 sem renovacao, simulando a data 01/10/2027 (CA-19.2)", async () => {
    // selo_valido_ate = 01/10/2027 (12 meses depois de verificado_em);
    // "agora" e' Date.now() real do teste, que roda bem depois dessa
    // data simulada de concessao - representamos a passagem do tempo
    // com um selo_valido_ate no passado em relacao a "agora".
    businessesResult = {
      data: [{ id: "biz-expirado", selo_valido_ate: "2020-01-01T00:00:00Z" }],
      error: null,
    };
    const { POST } = await import("../route");

    const res = await POST(request({ "x-cron-secret": "segredo-de-teste" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, expired: 1, avisados: 0 });
    expect(updateInMock).toHaveBeenCalledWith("id", ["biz-expirado"]);
  });

  it("nao expira um selo ainda valido e distante do vencimento (60 dias)", async () => {
    const futuro = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    businessesResult = {
      data: [{ id: "biz-valido", selo_valido_ate: futuro }],
      error: null,
    };
    const { POST } = await import("../route");

    const res = await POST(request({ "x-cron-secret": "segredo-de-teste" }));

    const body = await res.json();
    expect(body).toEqual({ ok: true, expired: 0, avisados: 0 });
    expect(updateInMock).not.toHaveBeenCalled();
  });

  it("e' idempotente: rodar 2x no mesmo dia nao duplica o efeito", async () => {
    businessesResult = {
      data: [{ id: "biz-expirado", selo_valido_ate: "2020-01-01T00:00:00Z" }],
      error: null,
    };
    const { POST } = await import("../route");

    const first = await POST(request({ "x-cron-secret": "segredo-de-teste" }));
    expect((await first.json()).expired).toBe(1);

    // 2a rodada: o negocio ja nao esta mais "verificado" (a query real
    // filtra por status='verificado'), entao o mock simula a lista
    // vazia que o banco devolveria apos a 1a expiracao.
    businessesResult = { data: [], error: null };
    updateInMock.mockClear();

    const second = await POST(request({ "x-cron-secret": "segredo-de-teste" }));
    const secondBody = await second.json();

    expect(secondBody).toEqual({ ok: true, expired: 0, avisados: 0 });
    expect(updateInMock).not.toHaveBeenCalled();
  });

  it("avisa (CA-19.2) um selo que vence em 25 dias, sem expirar (Fix 5, rodada 1 do Verifier)", async () => {
    const em25dias = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();
    businessesResult = {
      data: [
        {
          id: "biz-vencendo",
          selo_valido_ate: em25dias,
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
    expect(updateInMock).not.toHaveBeenCalled();
    expect(enqueueNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "selo_expirando_em_breve",
        destinatarioId: "owner-1",
        payload: expect.objectContaining({ businessId: "biz-vencendo" }),
      })
    );
  });

  // Gap 3 (Minor, rodada 2 do Verifier): sem dedup, um selo na janela de
  // 30 dias receberia o aviso todo dia (ate' 30x). Ja avisado nesta
  // janela -> nao enfileira de novo.
  it("nao repete o aviso quando ja foi avisado nesta janela (Gap 3)", async () => {
    wasNearingExpiryNotifiedMock.mockResolvedValueOnce(true);
    const em25dias = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();
    businessesResult = {
      data: [
        {
          id: "biz-ja-avisado",
          selo_valido_ate: em25dias,
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
