import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  saveLocalDraft,
  getLocalDraft,
  flushWhenOnline,
} from "../draft-store";

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}

beforeEach(() => {
  setOnline(true);
});

describe("saveLocalDraft / getLocalDraft (RN-07)", () => {
  it("retorna null quando nao ha rascunho salvo", async () => {
    expect(await getLocalDraft("negocio-inexistente")).toBeNull();
  });

  it("salva e le uma parte do rascunho", async () => {
    await saveLocalDraft("negocio-1", 1, { nome: "Raimunda" });

    const snapshot = await getLocalDraft("negocio-1");
    expect(snapshot).not.toBeNull();
    expect(snapshot?.parts[1]).toEqual({ nome: "Raimunda" });
    expect(snapshot?.dirty).toBe(true);
  });

  it("mescla partes diferentes sem perder as anteriores, mesmo sem internet (CA-07.1)", async () => {
    setOnline(false);

    await saveLocalDraft("negocio-2", 1, { nome: "Raimunda" });
    await saveLocalDraft("negocio-2", 3, { produtos: ["acai"] });

    const snapshot = await getLocalDraft("negocio-2");
    expect(snapshot?.parts).toEqual({
      1: { nome: "Raimunda" },
      3: { produtos: ["acai"] },
    });
  });

  it("uma nova gravacao da mesma parte substitui só aquela parte", async () => {
    await saveLocalDraft("negocio-3", 1, { nome: "rascunho" });
    await saveLocalDraft("negocio-3", 2, { cidade: "Cametá" });
    await saveLocalDraft("negocio-3", 1, { nome: "Raimunda" });

    const snapshot = await getLocalDraft("negocio-3");
    expect(snapshot?.parts).toEqual({
      1: { nome: "Raimunda" },
      2: { cidade: "Cametá" },
    });
  });
});

describe("flushWhenOnline (CA-07.2)", () => {
  it("não sincroniza enquanto estiver offline", async () => {
    setOnline(false);
    await saveLocalDraft("negocio-4", 1, { nome: "Raimunda" });

    const sync = vi.fn().mockResolvedValue(undefined);
    await flushWhenOnline("negocio-4", sync);

    expect(sync).not.toHaveBeenCalled();
  });

  it("sincroniza automaticamente quando a conexão volta, e marca como salvo", async () => {
    setOnline(false);
    await saveLocalDraft("negocio-5", 1, { nome: "Raimunda" });

    setOnline(true);
    const sync = vi.fn().mockResolvedValue(undefined);
    await flushWhenOnline("negocio-5", sync);

    expect(sync).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledWith(
      expect.objectContaining({ parts: { 1: { nome: "Raimunda" } } })
    );

    const snapshot = await getLocalDraft("negocio-5");
    expect(snapshot?.dirty).toBe(false);
  });

  it("não reenvia (não duplica) quando chamado de novo sem mudanças", async () => {
    await saveLocalDraft("negocio-6", 1, { nome: "Raimunda" });

    const sync = vi.fn().mockResolvedValue(undefined);
    await flushWhenOnline("negocio-6", sync);
    await flushWhenOnline("negocio-6", sync);
    await flushWhenOnline("negocio-6", sync);

    expect(sync).toHaveBeenCalledTimes(1);
  });

  it("nao faz nada quando nao ha rascunho para o negocio", async () => {
    const sync = vi.fn().mockResolvedValue(undefined);
    await flushWhenOnline("negocio-sem-rascunho", sync);
    expect(sync).not.toHaveBeenCalled();
  });

  // Gap 4 (Minor, rodada 2 do Verifier): antes, `dirty` era zerado
  // incondicionalmente depois de `await sync(snapshot)`, mesmo quando o
  // chamador (useDraftSync) engolia um `{ok:false}` de `saveDraftPart`
  // sem lancar - uma falha no meio do flush (rede caiu de novo, ou o
  // servidor rejeitou) marcava o rascunho como sincronizado mesmo assim,
  // perdendo a edicao local pra sempre (nunca mais reenviada). Aqui
  // testamos a metade de `flushWhenOnline`: quando `sync` lanca, `dirty`
  // continua `true` para a proxima tentativa.
  it("quando sync falha (lanca), mantem dirty=true - nao marca como sincronizado (Gap 4)", async () => {
    await saveLocalDraft("negocio-7", 1, { nome: "Raimunda" });

    const sync = vi.fn().mockRejectedValue(new Error("falha ao salvar"));
    await expect(flushWhenOnline("negocio-7", sync)).rejects.toThrow("falha ao salvar");

    const snapshot = await getLocalDraft("negocio-7");
    expect(snapshot?.dirty).toBe(true);
  });
});
