import { createClient } from "@supabase/supabase-js";

/**
 * Cliente com a chave de servico (bypassa RLS). Uso restrito a
 * operacoes server-only que precisam existir antes de haver uma policy
 * de RLS para o caso (ex.: criar o profile no primeiro login, em
 * verifyOtp, antes das policies de profiles do T12). Nunca importar em
 * codigo que roda no browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
