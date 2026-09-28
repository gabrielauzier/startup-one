import { describe, it, expect, vi, beforeEach } from "vitest";

const NOW = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

let draftsData: { id: string; created_at: string }[] = [];
let lastRevisionByBusiness: Record<string, string | null> = {};
let pendingRequestsData: { id: string; created_at: string }[] = [];
let releasedRequestsData: { id: string; created_at: string; expira_em: string | null }[] = [];
let pendingInterestsData: { id: string; created_at: string }[] = [];

const businessesDeleteInMock = vi.fn().mockResolvedValue({ error: null });
const documentRequestsUpdateEqMock = vi.fn();
const documentRequestsUpdateMock = vi.fn(() => ({ in: documentRequestsUpdateEqMock }));
const interestsUpdateEqMock = vi.fn();
const interestsUpdateMock = vi.fn(() => ({ in: interestsUpdateEqMock }));

const fromMock = vi.fn((table: string) => {
  if (table === "businesses") {
    return {
      select: () => ({ eq: () => Promise.resolve({ data: draftsData, error: null }) }),
      delete: () => ({ in: businessesDeleteInMock }),
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
  if (table === "document_requests") {
    return {
      select: () => ({
        eq: (_col: string, status: string) => {
          const data = status === "pendente" ? pendingRequestsData : releasedRequestsData;
          return Promise.resolve({ data, error: null });
        },
      }),
      update: documentRequestsUpdateMock,
    };
  }
  if (table === "interests") {
    return {
      select: () => ({ eq: () => Promise.resolve({ data: pendingInterestsData, error: null }) }),
      update: interestsUpdateMock,
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
  draftsData = [];
  lastRevisionByBusiness = {};
  pendingRequestsData = [];
  releasedRequestsData = [];
  pendingInterestsData = [];
  businessesDeleteInMock.mockResolvedValue({ error: null });
  documentRequestsUpdateEqMock.mockResolvedValue({ error: null });
  interestsUpdateEqMock.mockResolvedValue({ error: null });
});

function request() {
  return new Request("http://localhost/api/cron/daily", {
    method: "POST",
    headers: { "x-cron-secret": "segredo-de-teste" },
  });
}

describe("POST /api/cron/daily (T55, RNF-08)", () => {
  it("retorna 401 sem o header do segredo", async () => {
    const { POST } = await import("../route");
    const res = await POST(new Request("http://localhost/api/cron/daily", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("orquestra as 4 expiracoes na mesma chamada", async () => {
    draftsData = [{ id: "biz-velho", created_at: new Date(NOW - 91 * DAY_MS).toISOString() }];
    pendingRequestsData = [{ id: "req-1", created_at: new Date(NOW - 8 * DAY_MS).toISOString() }];
    releasedRequestsData = [
      {
        id: "req-2",
        created_at: new Date(NOW - 40 * DAY_MS).toISOString(),
        expira_em: new Date(NOW - 1 * DAY_MS).toISOString(),
      },
    ];
    pendingInterestsData = [{ id: "int-1", created_at: new Date(NOW - 11 * DAY_MS).toISOString() }];

    const { POST } = await import("../route");
    const res = await POST(request());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({
      ok: true,
      expired: { rascunhos: 1, pedidosDocumento: 1, acessosDocumento: 1, interesses: 1 },
    });

    expect(businessesDeleteInMock).toHaveBeenCalledWith("id", ["biz-velho"]);
    expect(documentRequestsUpdateMock).toHaveBeenCalledWith({ status: "expirado" });
    expect(documentRequestsUpdateEqMock).toHaveBeenCalledWith("id", ["req-1"]);
    expect(documentRequestsUpdateEqMock).toHaveBeenCalledWith("id", ["req-2"]);
    expect(interestsUpdateMock).toHaveBeenCalledWith({ status: "expirado" });
    expect(interestsUpdateEqMock).toHaveBeenCalledWith("id", ["int-1"]);
  });

  it("idempotente: rodar 2x seguidas no mesmo dia - a 2a chamada nao encontra mais nada elegivel", async () => {
    draftsData = [{ id: "biz-velho", created_at: new Date(NOW - 91 * DAY_MS).toISOString() }];
    pendingInterestsData = [{ id: "int-1", created_at: new Date(NOW - 11 * DAY_MS).toISOString() }];

    const { POST } = await import("../route");

    const res1 = await POST(request());
    const body1 = await res1.json();
    expect(body1.expired).toEqual({
      rascunhos: 1,
      pedidosDocumento: 0,
      acessosDocumento: 0,
      interesses: 1,
    });

    // 2a chamada: simula o efeito da 1a (rascunho apagado, so' o
    // admin mock precisa refletir isso porque nao ha banco real aqui)
    // - o negocio some da lista de rascunhos e o interesse ja' nao e'
    // mais pendente.
    draftsData = [];
    pendingInterestsData = [];

    const res2 = await POST(request());
    const body2 = await res2.json();
    expect(body2.expired).toEqual({
      rascunhos: 0,
      pedidosDocumento: 0,
      acessosDocumento: 0,
      interesses: 0,
    });
  });
});
