import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { saveLocalDraft, getLocalDraft } from "../draft-store";

const saveDraftPartMock = vi.fn();

vi.mock("@/app/(producer)/produtor/cadastro/actions", () => ({
  saveDraftPart: (...args: unknown[]) => saveDraftPartMock(...args),
}));

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setOnline(true);
});

// Gap 4 (Minor, rodada 2 do Verifier): `useDraftSync` ignorava o
// `{ok:false}` de `saveDraftPart` - uma falha no meio do flush (rede
// caiu de novo, ou o servidor rejeitou) era tratada como sucesso,
// marcando o rascunho local como sincronizado mesmo sem ter sido salvo
// de verdade. A correção: o callback de sync agora lança quando
// `saveDraftPart` retorna `{ok:false}`, e `flushWhenOnline` só zera
// `dirty` depois que o callback resolve com sucesso.
describe("useDraftSync (CA-07.1/CA-07.2) - Gap 4, rodada 2 do Verifier", () => {
  it("quando saveDraftPart falha, o rascunho local continua marcado como nao sincronizado", async () => {
    saveDraftPartMock.mockResolvedValue({ ok: false, error: "Não foi possível salvar." });
    await saveLocalDraft("negocio-offline-fail", 2, { cidade: "Cametá" });

    const { useDraftSync } = await import("../use-draft-sync");
    const { result } = renderHook(() => useDraftSync("negocio-offline-fail", 2));

    // O flush inicial (agendado no montar) tenta sincronizar o rascunho
    // pendente da "sessão anterior" - saveDraftPart falha, então o
    // status deve voltar para "salvo_no_celular" (nunca "salvo"), e a
    // flag `dirty` no IndexedDB deve continuar true para a próxima
    // tentativa.
    await waitFor(() => {
      expect(saveDraftPartMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(result.current.status).toBe("salvo_no_celular");
    });

    const snapshot = await getLocalDraft("negocio-offline-fail");
    expect(snapshot?.dirty).toBe(true);
  });

  it("quando saveDraftPart tem sucesso, o rascunho local e marcado como sincronizado", async () => {
    saveDraftPartMock.mockResolvedValue({ ok: true });
    await saveLocalDraft("negocio-offline-ok", 2, { cidade: "Cametá" });

    const { useDraftSync } = await import("../use-draft-sync");
    const { result } = renderHook(() => useDraftSync("negocio-offline-ok", 2));

    await waitFor(() => {
      expect(saveDraftPartMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(result.current.status).toBe("salvo");
    });

    const snapshot = await getLocalDraft("negocio-offline-ok");
    expect(snapshot?.dirty).toBe(false);
  });
});
