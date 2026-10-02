import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para Client Components. So usa variaveis publicas
 * (NEXT_PUBLIC_*) - nenhuma chave de servico entra neste arquivo (RNF-05).
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
