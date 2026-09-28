import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
const upsertMock = vi.fn().mockResolvedValue({ error: null });

function selectChain(result: unknown) {
  return {
    eq: () => ({
      maybeSingle: () => Promise.resolve(result),
    }),
  };
}

let investorAnswersRow: { data: Record<string, unknown> | null } = { data: null };

const sessionFromMock = vi.fn(() => ({
  upsert: upsertMock,
  select: () => selectChain(investorAnswersRow),
}));

const createServerClientMock = vi.fn().mockResolvedValue({
  auth: { getUser: getUserMock },
  from: sessionFromMock,
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createServerClientMock,
}));

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStore),
}));

const trackEventMock = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/lib/analytics/track", () => ({
  trackEvent: trackEventMock,
}));

const COMPLETE_ANSWERS = {
  prioridade: "impacto" as const,
  faixaValor: "50_200k" as const,
  produtos: ["Alimentos"],
  prazoMaxMeses: 24,
  impactos: ["Floresta em pé"],
};

beforeEach(() => {
  vi.clearAllMocks();
  upsertMock.mockResolvedValue({ error: null });
  getUserMock.mockResolvedValue({ data: { user: null } });
  investorAnswersRow = { data: null };
  trackEventMock.mockResolvedValue({ ok: true });
});

describe("saveAnswers (RN-22/RN-23)", () => {
  it("visitante: grava so' o cookie, nunca investor_answers", async () => {
    const { saveAnswers } = await import("../actions");

    await saveAnswers(COMPLETE_ANSWERS);

    expect(cookieStore.set).toHaveBeenCalledWith(
      "iasy_descobrir_respostas",
      JSON.stringify(COMPLETE_ANSWERS),
      expect.objectContaining({ httpOnly: true, path: "/" })
    );
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("logado, respostas incompletas (so' a pergunta 1): grava cookie, nao grava no banco", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { saveAnswers } = await import("../actions");

    await saveAnswers({ prioridade: "impacto" });

    expect(cookieStore.set).toHaveBeenCalled();
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("logado, respostas completas: grava cookie E investor_answers (upsert por investor_id)", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { saveAnswers } = await import("../actions");

    await saveAnswers(COMPLETE_ANSWERS);

    expect(sessionFromMock).toHaveBeenCalledWith("investor_answers");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        investor_id: "user-1",
        prioridade: "impacto",
        faixa_valor: "50_200k",
        produtos: ["Alimentos"],
        prazo_max_meses: 24,
        impactos: ["Floresta em pé"],
      }),
      { onConflict: "investor_id" }
    );
  });

  it("pergunta 5 pulada (impactos ausentes) ainda persiste as 4 obrigatorias, com impactos vazio", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { saveAnswers } = await import("../actions");

    const { impactos, ...semImpacto } = COMPLETE_ANSWERS;
    void impactos;
    await saveAnswers(semImpacto);

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ impactos: [] }),
      { onConflict: "investor_id" }
    );
  });

  it("T56/RF-32: respostas completas dispara trackEvent('descoberta_concluida')", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { saveAnswers } = await import("../actions");

    await saveAnswers(COMPLETE_ANSWERS);

    expect(trackEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "descoberta_concluida", atorId: "user-1" })
    );
  });

  it("T56/RF-32: respostas incompletas NÃO dispara trackEvent", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const { saveAnswers } = await import("../actions");

    await saveAnswers({ prioridade: "impacto" });

    expect(trackEventMock).not.toHaveBeenCalled();
  });
});

describe("loadAnswers", () => {
  it("logado: le' de investor_answers e mapeia para camelCase", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    investorAnswersRow = {
      data: {
        prioridade: "retorno",
        faixa_valor: "ate_50k",
        produtos: ["Cacau"],
        prazo_max_meses: 18,
        impactos: [],
      },
    };
    const { loadAnswers } = await import("../actions");

    const result = await loadAnswers();

    expect(result).toEqual({
      prioridade: "retorno",
      faixaValor: "ate_50k",
      produtos: ["Cacau"],
      prazoMaxMeses: 18,
      impactos: [],
    });
    expect(cookieStore.get).not.toHaveBeenCalled();
  });

  it("visitante: le' do cookie quando existir", async () => {
    cookieStore.get.mockReturnValue({ value: JSON.stringify({ prioridade: "pessoas" }) });
    const { loadAnswers } = await import("../actions");

    const result = await loadAnswers();

    expect(result).toEqual({ prioridade: "pessoas" });
  });

  it("visitante sem cookie: devolve objeto vazio", async () => {
    cookieStore.get.mockReturnValue(undefined);
    const { loadAnswers } = await import("../actions");

    expect(await loadAnswers()).toEqual({});
  });
});

describe("migrateCookieAnswersToProfile (CA-23.1)", () => {
  it("cookie completo: grava em investor_answers e apaga o cookie", async () => {
    cookieStore.get.mockReturnValue({ value: JSON.stringify(COMPLETE_ANSWERS) });
    const { migrateCookieAnswersToProfile } = await import("../actions");

    await migrateCookieAnswersToProfile("user-1");

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ investor_id: "user-1" }),
      { onConflict: "investor_id" }
    );
    expect(cookieStore.delete).toHaveBeenCalledWith("iasy_descobrir_respostas");
  });

  it("cookie incompleto: nao grava nada e mantem o cookie (visitante ainda respondendo)", async () => {
    cookieStore.get.mockReturnValue({ value: JSON.stringify({ prioridade: "impacto" }) });
    const { migrateCookieAnswersToProfile } = await import("../actions");

    await migrateCookieAnswersToProfile("user-1");

    expect(upsertMock).not.toHaveBeenCalled();
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });

  it("sem cookie: nao faz nada", async () => {
    cookieStore.get.mockReturnValue(undefined);
    const { migrateCookieAnswersToProfile } = await import("../actions");

    await migrateCookieAnswersToProfile("user-1");

    expect(upsertMock).not.toHaveBeenCalled();
    expect(cookieStore.delete).not.toHaveBeenCalled();
  });
});
