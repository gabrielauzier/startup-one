"use client";

import { useCallback, useEffect, useState } from "react";
import { saveLocalDraft, flushWhenOnline } from "./draft-store";
import { saveDraftPart } from "@/app/(producer)/produtor/cadastro/actions";

export type DraftSyncStatus = "salvo" | "salvo_no_celular" | "sincronizando";

function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

/**
 * RN-07/CA-07.1/CA-07.2: liga o rascunho local (lib/offline/draft-store.ts,
 * T15) a UI do cadastro. Toda mudanca relevante do formulario e' salva no
 * aparelho via `saveDraft` (chamador decide o debounce); quando a conexao
 * volta, sincroniza automaticamente com o servidor via `saveDraftPart`
 * (T17) sem acao do usuario. `status` alimenta o indicador do
 * `PartHeader`: "salvo_no_celular" enquanto offline ou com mudancas
 * pendentes, "sincronizando" durante o envio, e "salvo" depois do flush.
 */
export function useDraftSync(businessId: string, part: 1 | 2 | 3 | 4 | 5) {
  const [status, setStatus] = useState<DraftSyncStatus>(() =>
    isOffline() ? "salvo_no_celular" : "salvo"
  );

  const flush = useCallback(async () => {
    if (isOffline()) {
      setStatus("salvo_no_celular");
      return;
    }

    setStatus("sincronizando");
    try {
      await flushWhenOnline(businessId, async (snapshot) => {
        for (const [snapshotPart, data] of Object.entries(snapshot.parts)) {
          const result = await saveDraftPart(
            businessId,
            Number(snapshotPart) as 1 | 2 | 3 | 4 | 5,
            data as Record<string, unknown>
          );
          // Gap 4 (Minor, rodada 2 do Verifier): antes, um `{ok:false}`
          // (rede caiu de novo no meio do flush, ou o servidor
          // rejeitou) era ignorado aqui - `flushWhenOnline` marcava o
          // rascunho como sincronizado (`dirty:false`) mesmo assim,
          // perdendo a edicao local sem nunca reenviar. Lancar aqui
          // propaga a falha para `flushWhenOnline`, que so' zera
          // `dirty` depois que este callback resolve com sucesso.
          if (!result.ok) {
            throw new Error(result.error ?? "Falha ao sincronizar o rascunho.");
          }
        }
      });
      setStatus(isOffline() ? "salvo_no_celular" : "salvo");
    } catch {
      // Mantem "salvo_no_celular": o rascunho continua `dirty` no
      // IndexedDB (flushWhenOnline nao chegou a limpar a flag) e sera
      // reenviado no proximo evento `online` ou no proximo poll.
      setStatus("salvo_no_celular");
    }
  }, [businessId]);

  useEffect(() => {
    // Agendado (nao chamado direto no corpo do efeito) para nao disparar
    // setState sincrono durante o efeito - so tenta sincronizar um
    // rascunho pendente de uma sessao anterior depois de montar.
    const initialFlush = setTimeout(() => {
      void flush();
    }, 0);

    function handleOnline() {
      void flush();
    }
    function handleOffline() {
      setStatus("salvo_no_celular");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Os eventos `online`/`offline` do browser nao sao confiaveis em
    // todo ambiente (inclusive alguns emuladores de rede) - um polling
    // leve serve de rede de seguranca para nao deixar o rascunho preso
    // em "Salvo no celular" depois que a conexao volta de verdade.
    let lastOnline = !isOffline();
    const poll = setInterval(() => {
      const online = !isOffline();
      if (online !== lastOnline) {
        lastOnline = online;
        if (online) {
          void flush();
        } else {
          setStatus("salvo_no_celular");
        }
      }
    }, 1000);

    return () => {
      clearTimeout(initialFlush);
      clearInterval(poll);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flush]);

  const saveDraft = useCallback(
    async (data: Record<string, unknown>) => {
      await saveLocalDraft(businessId, part, data);
      if (isOffline()) {
        setStatus("salvo_no_celular");
      }
    },
    [businessId, part]
  );

  return { status, saveDraft };
}
