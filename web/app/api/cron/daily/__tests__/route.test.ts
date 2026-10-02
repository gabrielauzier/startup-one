import { describe, it, expect, vi, beforeEach } from "vitest";

const NOW = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

let draftsData: { id: string; created_at: string; owner_id?: string; nome?: string }[] = [];
let lastRevisionByBusiness: Record<string, string | null> = {};
let pendingRequestsData: { id: string; created_at: string }[] = [];
let releasedRequestsData: { id: string; created_at: string; expira_em: string | null }[] = [];
let pendingInterestsData: { id: string; created_at: string }[] = [];
let verificadosData: {
  id: string;
  selo_valido_ate: string | null;
  owner_id?: string;
  nome?: string;
}[] = [];
// Gap 3 (rodada 2): ids de negocio "ja avisados" nesta janela - simula
// o que `wasNearingExpiryNotified` acharia em `events`.
let jaAvisadosIds: Set<string> = new Set();

const businessesDeleteInMock = vi.fn().mockResolvedValue({ error: null });
const businessesUpdateEqMock = vi.fn().mockResolvedValue({ error: null });
const businessesUpdateMock = vi.fn(() => ({ in: businessesUpdateEqMock }));
const documentRequestsUpdateEqMock = vi.fn();
const documentRequestsUpdateMock = vi.fn(() => ({ in: documentRequestsUpdateEqMock }));
const interestsUpdateEqMock = vi.fn();
const interestsUpdateMock = vi.fn(() => ({ in: interestsUpdateEqMock }));
const eventsInsertMock = vi.fn().mockResolvedValue({ error: null });

const fromMock = vi.fn((table: string) => {
  if (table === "businesses") {
    return {
      select: () => ({
        eq: (_col: string, status: string) =>
          Promise.resolve({
            data: status === "verificado" ? verificadosData : draftsData,
            error: null,
          }),
      }),
      delete: () => ({ in: businessesDeleteInMock }),
      update: businessesUpdateMock,
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
  if (table === "events") {
    return {
      insert: eventsInsertMock,
      // wasNearingExpiryNotified: select("id").eq("type",...).eq("payload->>businessId", id).gte(...).limit(1).maybeSingle()
      select: () => ({
        eq: () => ({
          eq: (_col2: string, businessId: string) => ({
            gte: () => ({
              limit: () => ({
                maybeSingle: () =>
                  Promise.resolve({
                    data: jaAvisadosIds.has(businessId) ? { id: "evt-existente" } : null,
                  }),
              }),
            }),
          }),
        }),
      }),
    };
  }
  throw new Error(`tabela inesperada no mock: ${table}`);
});

const getUserByIdMock = vi.fn().mockResolvedValue({
  data: { user: { email: "produtor@example.com" } },
  error: null,
});
const createAdminClientMock = vi.fn().mockReturnValue({
  from: fromMock,
  auth: { admin: { getUserById: getUserByIdMock } },
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

const sendEmailMock = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/lib/notifications/send-email", () => ({
  sendEmail: sendEmailMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "segredo-de-teste";
  draftsData = [];
  lastRevisionByBusiness = {};
  pendingRequestsData = [];
  releasedRequestsData = [];
  pendingInterestsData = [];
  verificadosData = [];
  jaAvisadosIds = new Set();
  businessesDeleteInMock.mockResolvedValue({ error: null });
  businessesUpdateEqMock.mockResolvedValue({ error: null });
  documentRequestsUpdateEqMock.mockResolvedValue({ error: null });
  interestsUpdateEqMock.mockResolvedValue({ error: null });
  eventsInsertMock.mockResolvedValue({ error: null });
  sendEmailMock.mockResolvedValue({ ok: true });
  getUserByIdMock.mockResolvedValue({
    data: { user: { email: "produtor@example.com" } },
    error: null,
  });
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

  it("Vercel Cron: GET com Authorization Bearer e' aceito; Bearer errado da 401", async () => {
    const { GET } = await import("../route");
    const ok = await GET(
      new Request("http://localhost/api/cron/daily", {
        method: "GET",
        headers: { authorization: "Bearer segredo-de-teste" },
      })
    );
    expect(ok.status).toBe(200);

    const bad = await GET(
      new Request("http://localhost/api/cron/daily", {
        method: "GET",
        headers: { authorization: "Bearer errado" },
      })
    );
    expect(bad.status).toBe(401);
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
      expired: { rascunhos: 1, pedidosDocumento: 1, acessosDocumento: 1, interesses: 1, selos: 0 },
      avisados: { rascunhos: 0, selos: 0 },
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
      selos: 0,
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
      selos: 0,
    });
  });

  // Gap 2 (Major, rodada 2 do Verifier): o design agenda so' `/api/cron/daily`
  // como o cron de producao (design.md) - o aviso de 7 dias (CA-07.3)
  // precisa estar aqui, nao so' na rota antiga `expire-drafts`.
  it("avisa um rascunho a 85 dias sem atividade (faltam 7 dias) sem apagar (CA-07.3, Gap 2)", async () => {
    draftsData = [
      { id: "biz-85", created_at: new Date(NOW - 85 * DAY_MS).toISOString(), owner_id: "user-1", nome: "Negócio 85" },
    ];

    const { POST } = await import("../route");
    const res = await POST(request());
    const body = await res.json();

    expect(body.expired.rascunhos).toBe(0);
    expect(body.avisados.rascunhos).toBe(1);
    expect(businessesDeleteInMock).not.toHaveBeenCalled();
    expect(eventsInsertMock).toHaveBeenCalledTimes(1);
    const rows = eventsInsertMock.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows.some((r) => r.type === "rascunho_expirando_em_breve")).toBe(true);
  });

  // CA-19.2/Gap 2: o mesmo vale para o aviso de 30 dias do selo, que
  // tambem so' existia em `expire-seals` antes desta rodada.
  it("avisa um selo que vence em 25 dias (faltam 30 dias) sem expirar (CA-19.2, Gap 2)", async () => {
    verificadosData = [
      {
        id: "biz-selo",
        selo_valido_ate: new Date(NOW + 25 * DAY_MS).toISOString(),
        owner_id: "user-2",
        nome: "Negócio com selo",
      },
    ];

    const { POST } = await import("../route");
    const res = await POST(request());
    const body = await res.json();

    expect(body.expired.selos).toBe(0);
    expect(body.avisados.selos).toBe(1);
    expect(businessesUpdateMock).not.toHaveBeenCalled();
    const rows = eventsInsertMock.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows.some((r) => r.type === "selo_expirando_em_breve")).toBe(true);
  });

  // Gap 3 (Minor, rodada 2 do Verifier): rodar o cron 2 dias seguidos
  // com o mesmo rascunho ainda na janela so' enfileira o aviso 1x - a
  // 2a chamada ja' acha o evento da 1a (jaAvisadosIds simula isso).
  it("nao repete o aviso de 7 dias em 2 chamadas seguidas na mesma janela (Gap 3)", async () => {
    draftsData = [
      { id: "biz-85", created_at: new Date(NOW - 85 * DAY_MS).toISOString(), owner_id: "user-1", nome: "Negócio 85" },
    ];

    const { POST } = await import("../route");

    const res1 = await POST(request());
    const body1 = await res1.json();
    expect(body1.avisados.rascunhos).toBe(1);

    // Simula o cron do dia seguinte: o negocio ainda esta na janela
    // (86 dias), mas ja foi avisado - `events` ja' tem a linha.
    jaAvisadosIds.add("biz-85");
    draftsData = [
      { id: "biz-85", created_at: new Date(NOW - 86 * DAY_MS).toISOString(), owner_id: "user-1", nome: "Negócio 85" },
    ];

    const res2 = await POST(request());
    const body2 = await res2.json();
    expect(body2.avisados.rascunhos).toBe(0);
    expect(eventsInsertMock).toHaveBeenCalledTimes(1);
  });
});
