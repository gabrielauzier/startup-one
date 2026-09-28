"use server";

import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VISITOR_COOKIE = "iasy_visitor";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * RN-35/CA-35.1: registra 1 visita ao perfil do negócio - deduplicada
 * por dia por pessoa (`profile_visits_unique_per_day`, T39). Visitante
 * logado usa `investor_id`; visitante anônimo usa um cookie httpOnly
 * (`iasy_visitor`) gerado na primeira visita e reaproveitado nas
 * seguintes, para não contar 2 visitas do mesmo anônimo no mesmo dia.
 *
 * Chamada por um Server Action (não pelo Server Component da página)
 * porque `cookies().set()` só é permitido em Server Actions/Route
 * Handlers - um Server Component não pode escrever cookies durante a
 * renderização (lib/supabase/server.ts documenta a mesma restrição).
 */
export async function recordProfileVisit(businessId: string): Promise<void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let sessionId: string | null = null;
  if (!user) {
    const store = await cookies();
    sessionId = store.get(VISITOR_COOKIE)?.value ?? null;
    if (!sessionId) {
      sessionId = randomUUID();
      store.set(VISITOR_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: ONE_YEAR_SECONDS,
        path: "/",
      });
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profile_visits").insert({
    business_id: businessId,
    investor_id: user?.id ?? null,
    session_id: user ? null : sessionId,
  });

  // 23505 = violação do índice único de 1 visita/dia/pessoa - já
  // contada hoje, nada a fazer. Qualquer outro erro é ignorado de
  // propósito: registrar a visita nunca deve quebrar o carregamento
  // da página do negócio.
  if (error && error.code !== "23505") {
    console.error("Falha ao registrar visita ao perfil", error);
  }
}
