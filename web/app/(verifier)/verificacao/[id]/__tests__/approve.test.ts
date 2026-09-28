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

let businessResult: { data: { id: string; status: string; owner_id?: string; nome?: string } | null } = {
  data: { id: "biz-1", status: "em_analise", owner_id: "owner-1", nome: "Negócio Teste" },
};
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
  throw new Error(`tabela inesperada no cliente admin: ${table}`);
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

const COMPLETE_CHECKLIST = {
  cnpj_ativo: true,
  documento_terra_legivel: true,
  fotos_compativeis: true,
  producao_coerente: true,
  praticas_plausiveis: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  getUserMock.mockResolvedValue({ data: { user: { id: "verifier-1" } } });
  sessionProfileSelectMock.mockResolvedValue({ data: { role: "verificador" } });
  businessResult = { data: { id: "biz-1", status: "em_analise", owner_id: "owner-1", nome: "Negócio Teste" } };
  updateMock.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  verificationsInsertMock.mockResolvedValue({ error: null });
  enqueueNotificationMock.mockResolvedValue({ ok: true });
});

describe("approve (RF-15, RN-18, RN-19)", () => {
  it("rejeita quando o checklist esta incompleto (CA-18.1) e nao escreve nada", async () => {
    const { approve } = await import("../actions");

    const result = await approve({
      businessId: "biz-1",
      checklist: { ...COMPLETE_CHECKLIST, praticas_plausiveis: false },
      notaA: 94,
      notaS: 91,
      notaG: 86,
    });

    expect(result.ok).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejeita nota decimal antes de qualquer escrita (CA-19.1)", async () => {
    const { approve } = await import("../actions");

    const result = await approve({
      businessId: "biz-1",
      checklist: COMPLETE_CHECKLIST,
      notaA: 94.5,
      notaS: 91,
      notaG: 86,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("inteiros entre 0 e 100");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("rejeita nota fora de 0-100 antes de qualquer escrita (CA-19.1)", async () => {
    const { approve } = await import("../actions");

    const result = await approve({
      businessId: "biz-1",
      checklist: COMPLETE_CHECKLIST,
      notaA: 101,
      notaS: 91,
      notaG: 86,
    });

    expect(result.ok).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("concede o selo por 12 meses e grava as notas quando tudo e' valido", async () => {
    const { approve } = await import("../actions");

    await expect(
      approve({
        businessId: "biz-1",
        checklist: COMPLETE_CHECKLIST,
        notaA: 94,
        notaS: 91,
        notaG: 86,
      })
    ).rejects.toThrow("REDIRECT:/verificacao");

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "verificado",
        nota_a: 94,
        nota_s: 91,
        nota_g: 86,
      })
    );
    const call = updateMock.mock.calls[0][0];
    const verificadoEm = new Date(call.verificado_em);
    const seloValidoAte = new Date(call.selo_valido_ate);
    expect(seloValidoAte.getUTCFullYear()).toBe(verificadoEm.getUTCFullYear() + 1);
  });

  it("T54/RF-31: avisa o produtor do selo concedido via enqueueNotification", async () => {
    const { approve } = await import("../actions");

    await expect(
      approve({
        businessId: "biz-1",
        checklist: COMPLETE_CHECKLIST,
        notaA: 94,
        notaS: 91,
        notaG: 86,
      })
    ).rejects.toThrow("REDIRECT:/verificacao");

    expect(enqueueNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "selo_concedido",
        destinatarioId: "owner-1",
      })
    );
  });

  it("grava a decisao em verifications com autor e sem endpoint de edicao (RF-16/CA-18.2)", async () => {
    const { approve } = await import("../actions");

    await expect(
      approve({
        businessId: "biz-1",
        checklist: COMPLETE_CHECKLIST,
        notaA: 94,
        notaS: 91,
        notaG: 86,
      })
    ).rejects.toThrow("REDIRECT:/verificacao");

    expect(verificationsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        business_id: "biz-1",
        verifier_id: "verifier-1",
        decisao: "aprovar",
      })
    );
    // O modulo actions.ts nao exporta nenhuma funcao de update/delete
    // para `verifications` - decisao gravada e' imutavel por design.
    const actionsModule = await import("../actions");
    expect(Object.keys(actionsModule)).not.toContain("updateVerification");
  });

  it("rejeita transicao invalida (ex.: negocio ja verificado)", async () => {
    businessResult = { data: { id: "biz-1", status: "verificado" } };
    const { approve } = await import("../actions");

    const result = await approve({
      businessId: "biz-1",
      checklist: COMPLETE_CHECKLIST,
      notaA: 94,
      notaS: 91,
      notaG: 86,
    });

    expect(result.error).toContain("Transição de estado inválida");
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("recusa quem nao e' verificador", async () => {
    sessionProfileSelectMock.mockResolvedValue({ data: { role: "produtor" } });
    const { approve } = await import("../actions");

    const result = await approve({
      businessId: "biz-1",
      checklist: COMPLETE_CHECKLIST,
      notaA: 94,
      notaS: 91,
      notaG: 86,
    });

    expect(result.ok).toBe(false);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
