"use client";

import { useEffect } from "react";

/**
 * Registra o service worker do cadastro (RNF-01), escopado a
 * /produtor/cadastro/. Falha silenciosamente se o navegador nao suportar
 * ou se o registro falhar: o cadastro continua funcionando online sem ele.
 */
export function RegisterCadastroSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw-cadastro.js", { scope: "/produtor/cadastro/" })
      .catch(() => {});
  }, []);

  return null;
}
