import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ProductEventType } from "../track";

const insertMock = vi.fn().mockResolvedValue({ error: null });
const fromMock = vi.fn((table: string) => {
  if (table === "events") {
    return { insert: insertMock };
  }
  throw new Error(`tabela inesperada no mock: ${table}`);
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: fromMock })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  insertMock.mockResolvedValue({ error: null });
});

const ALL_TYPES: ProductEventType[] = [
  "cadastro_iniciado",
  "cadastro_enviado",
  "descoberta_concluida",
  "interesse_enviado",
  "conexao_em_negociacao",
];

describe("trackEvent (T56, RF-32)", () => {
  it.each(ALL_TYPES)("grava kind='produto' e o tipo/payload corretos para %s", async (type) => {
    const { trackEvent } = await import("../track");
    const payload = { negocioId: "biz-1" };

    const result = await trackEvent({ type, payload, atorId: "user-1" });

    expect(result.ok).toBe(true);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "produto",
        type,
        payload,
        destinatario_id: "user-1",
        canal: null,
      })
    );
  });

  it("atorId omitido grava destinatario_id null", async () => {
    const { trackEvent } = await import("../track");
    await trackEvent({ type: "cadastro_iniciado", payload: {} });

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ destinatario_id: null })
    );
  });
});
