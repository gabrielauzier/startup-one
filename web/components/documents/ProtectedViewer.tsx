"use client";

import type { ReactNode } from "react";

/**
 * RN-34/CA-34.1: bloqueia o menu de contexto (que teria "Salvar como",
 * "Imprimir") sobre a área do documento. Client component só por causa
 * do handler - o conteúdo em si (iframe/imagem + marca d'água) continua
 * renderizado pelo Server Component da página.
 */
export function ProtectedViewer({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative h-full w-full"
      onContextMenu={(event) => event.preventDefault()}
    >
      {children}
    </div>
  );
}
