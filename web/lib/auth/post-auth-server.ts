import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { migrateCookieAnswersToProfile } from "@/app/(investor)/descobrir/actions";
import { resolvePostAuthDestination, type PostAuthDeps } from "./post-auth";
import { resolvePostLoginRedirect, type ProfileRole } from "./redirect";

/** Dependencias reais de `resolvePostAuthDestination` (Supabase + cookie de visitante). */
export function serverPostAuthDeps(): PostAuthDeps {
  return {
    async getProfile(userId) {
      const supabase = await createServerClient();
      const { data } = await supabase
        .from("profiles")
        .select("role, termos_aceitos_em")
        .eq("id", userId)
        .maybeSingle();
      return data
        ? { role: data.role as ProfileRole, termos_aceitos_em: data.termos_aceitos_em }
        : null;
    },
    migrateAnswers: migrateCookieAnswersToProfile,
    resolveDefault: (userId, role) =>
      resolvePostLoginRedirect(createAdminClient(), userId, role),
  };
}

/** Atalho usado pelas actions e pelo route handler. */
export function postAuthDestination(userId: string, requested?: string | null): Promise<string> {
  return resolvePostAuthDestination(serverPostAuthDeps(), { userId, requested });
}
