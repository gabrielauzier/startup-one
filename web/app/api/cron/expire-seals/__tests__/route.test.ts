import { describe, it, expect, vi, beforeEach } from "vitest";

let businessesResult: {
  data: { id: string; selo_valido_ate: string | null }[] | null;
  error: unknown;
} = { data: [], error: null };
const updateInMock = vi.fn().mockResolvedValue({ error: null });

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
    expect(body).toEqual({ ok: true, expired: 1 });
    expect(updateInMock).toHaveBeenCalledWith("id", ["biz-expirado"]);
  });

  it("nao expira um selo ainda valido", async () => {
    const futuro = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    businessesResult = {
      data: [{ id: "biz-valido", selo_valido_ate: futuro }],
      error: null,
    };
    const { POST } = await import("../route");

    const res = await POST(request({ "x-cron-secret": "segredo-de-teste" }));

    const body = await res.json();
    expect(body).toEqual({ ok: true, expired: 0 });
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

    expect(secondBody).toEqual({ ok: true, expired: 0 });
    expect(updateInMock).not.toHaveBeenCalled();
  });
});
