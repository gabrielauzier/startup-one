import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
const createServerClientMock = vi.fn().mockResolvedValue({
  auth: { getUser: getUserMock },
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));

let businessResult: {
  data: { id: string; owner_id: string; status: string } | null;
} = { data: { id: "biz-1", owner_id: "user-1", status: "rascunho" } };

let revisionsData: { dados: Record<string, unknown> }[] = [];
let evidencesData: { grupo: string }[] = [
  { grupo: "onde_produz" },
  { grupo: "produto" },
];
const updateMock = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});
const revisionsInsertMock = vi.fn().mockResolvedValue({ error: null });

const fromMock = vi.fn((table: string) => {
  if (table === "businesses") {
    return {
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve(businessResult) }),
      }),
      update: updateMock,
    };
  }
  if (table === "business_revisions") {
    return {
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: revisionsData }),
        }),
      }),
      insert: revisionsInsertMock,
    };
  }
  if (table === "evidences") {
    return {
      select: () => ({
        eq: () => Promise.resolve({ data: evidencesData }),
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

const enqueueNotificationMock = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/lib/notifications/queue", () => ({
  enqueueNotification: enqueueNotificationMock,
}));

const trackEventMock = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/lib/analytics/track", () => ({
  trackEvent: trackEventMock,
}));

function completeRevisions() {
  return [
    {
      dados: {
        part: 1,
        nome: "Raimunda",
        telefone: "91999999999",
        cnpj: "11444777000161",
        autorizacao: true,
      },
    },
    {
      dados: {
        part: 2,
        nome: "Cooperativa",
        tipoOrg: "cooperativa",
        cidade: "Cametá",
        uf: "PA",
        familias: 10,
        anosAtividade: 5,
      },
    },
    {
      dados: { part: 3, produtos: ["Açaí"], producaoMensalKg: 100, praticas: ["x"] },
    },
    {
      dados: {
        part: 5,
        finalidade: "obras",
        valorBusca: 100000,
        prazoMeses: 24,
        retornoProposto: 14.8,
      },
    },
  ];
}

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  businessResult = { data: { id: "biz-1", owner_id: "user-1", status: "rascunho" } };
  revisionsData = completeRevisions();
  evidencesData = [{ grupo: "onde_produz" }, { grupo: "produto" }];
  updateMock.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  revisionsInsertMock.mockResolvedValue({ error: null });
  enqueueNotificationMock.mockResolvedValue({ ok: true });
  trackEventMock.mockResolvedValue({ ok: true });
});

describe("submitBusiness (RF-12, RF-13, RN-14)", () => {
  it("falha e nao transiciona quando falta um campo obrigatorio", async () => {
    revisionsData = revisionsData.filter(
      (r) => (r.dados as { part: number }).part !== 5
    );
    const { submitBusiness } = await import("../actions");

    const result = await submitBusiness("biz-1", {}, new FormData());

    expect(result.error).toBe("Complete os campos obrigatórios antes de enviar.");
    expect(result.missing).toEqual(
      expect.arrayContaining([
        "Parte 5: finalidade",
        "Parte 5: valor",
        "Parte 5: prazo",
        "Parte 5: retorno proposto",
      ])
    );
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("chama assertTransition(rascunho, em_analise) e agrega o rascunho em businesses", async () => {
    const { submitBusiness } = await import("../actions");

    await expect(submitBusiness("biz-1", {}, new FormData())).rejects.toThrow(
      "REDIRECT:/produtor/cadastro/enviado"
    );

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        cnpj: "11444777000161",
        nome: "Cooperativa",
        status: "em_analise",
        retorno_proposto: 14.8,
      })
    );
  });

  it("T54/RF-31: avisa o produtor do cadastro recebido via enqueueNotification", async () => {
    const { submitBusiness } = await import("../actions");

    await expect(submitBusiness("biz-1", {}, new FormData())).rejects.toThrow(
      "REDIRECT:/produtor/cadastro/enviado"
    );

    expect(enqueueNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "cadastro_recebido",
        destinatarioId: "user-1",
      })
    );
  });

  it("T56/RF-32: registra o evento de produto cadastro_enviado via trackEvent", async () => {
    const { submitBusiness } = await import("../actions");

    await expect(submitBusiness("biz-1", {}, new FormData())).rejects.toThrow(
      "REDIRECT:/produtor/cadastro/enviado"
    );

    expect(trackEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "cadastro_enviado", atorId: "user-1" })
    );
  });

  it("rejeita uma transicao invalida (ex.: negocio ja verificado)", async () => {
    businessResult = { data: { id: "biz-1", owner_id: "user-1", status: "verificado" } };
    const { submitBusiness } = await import("../actions");

    const result = await submitBusiness("biz-1", {}, new FormData());

    expect(result.error).toContain("Transição de estado inválida");
    expect(updateMock).not.toHaveBeenCalled();
  });
});
