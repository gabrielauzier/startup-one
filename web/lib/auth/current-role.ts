import { createServerClient } from "@/lib/supabase/server";
import type { Role } from "./roles";

/**
 * Papel do usuário logado, direto da sessão - usado pelo `AppChrome`
 * (`app/layout.tsx`) pra decidir os links da nav. `null` para
 * visitante sem sessão. Mesma leitura que `proxy.ts`'s `getRole` faz,
 * mas como Server Component (não tem acesso a `NextRequest` aqui).
 */
export async function getCurrentRole(): Promise<Role | null> {
  return (await getCurrentAuthState()).role;
}

export interface CurrentAuthState {
  role: Role | null;
  /** AUTH-18: logado, com perfil, e nunca definiu senha (conta do MVP que entra por link). */
  needsPassword: boolean;
}

/** Papel + se falta definir senha, numa unica leitura de sessao (usado pelo layout raiz). */
export async function getCurrentAuthState(): Promise<CurrentAuthState> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { role: null, needsPassword: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = (profile?.role as Role) ?? null;
  return {
    role,
    needsPassword: role !== null && user.user_metadata?.has_password !== true,
  };
}
