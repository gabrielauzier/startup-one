"use client";

import { useEffect, useRef } from "react";
import { recordProfileVisit } from "@/app/(investor)/negocios/[slug]/actions";

/**
 * RN-35/CA-35.1: dispara `recordProfileVisit` (Server Action) uma vez
 * ao montar a página do negócio - client component "invisível" porque
 * a gravação depende de `cookies().set()`, só permitido em Server
 * Actions/Route Handlers, nunca durante a renderização de um Server
 * Component (ver comentário em actions.ts).
 */
export function RecordVisit({ businessId }: { businessId: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void recordProfileVisit(businessId);
  }, [businessId]);

  return null;
}
