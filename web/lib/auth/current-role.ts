import { createServerClient } from "@/lib/supabase/server";
import type { Role } from "./roles";

/**
 * Papel do usuário logado, direto da sessão - usado pelo `AppChrome`
 * (`app/layout.tsx`) pra decidir os links da nav. `null` para
 * visitante sem sessão. Mesma leitura que `proxy.ts`'s `getRole` faz,
 * mas como Server Component (não tem acesso a `NextRequest` aqui).
 */
export async function getCurrentRole(): Promise<Role | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return (profile?.role as Role) ?? null;
}
