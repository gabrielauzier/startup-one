"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics/track";
import { clearAuthContext, clearRecoveryFlag } from "./auth-context-cookie";

/**
 * AUTH-16: encerra a sessao, limpa os cookies de auth e volta para a
 * home. Falha ao registrar o evento nao impede o logout (AUTH-15.4).
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.auth.signOut();
  await clearAuthContext();
  await clearRecoveryFlag();

  try {
    await trackEvent({ type: "auth_logout", payload: {}, atorId: user?.id ?? null });
  } catch {
    // Telemetria nunca bloqueia o logout.
  }

  redirect("/");
}
