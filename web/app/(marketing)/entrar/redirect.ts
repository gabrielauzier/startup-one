import { createAdminClient } from "@/lib/supabase/admin";

export type EntrarRole = "investidor" | "empresa" | "produtor";
export type ProfileRole = EntrarRole | "verificador";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * So' aceita caminhos internos relativos (RF-03/CA-02.3): bloqueia
 * URLs absolutas e o truque `//host` (protocol-relative), que
 * levariam a um redirecionamento aberto para fora da Iasy.
 */
export function isSafeRedirect(path: string): path is string {
  return path.startsWith("/") && !path.startsWith("//");
}

/**
 * RF-03: redireciona por perfil apos o login. Investidor/empresa vao
 * para a descoberta, ou para a vitrine se ja responderam; produtor vai
 * para as boas-vindas, ou para o painel se ja enviou um cadastro;
 * verificador vai para a fila. `businesses` (T13) e `investor_answers`
 * (T32) ainda nao existem neste ponto do plano - a consulta so' passa
 * a encontrar linhas reais a partir dessas fases.
 */
export async function resolvePostLoginRedirect(
  admin: AdminClient,
  userId: string,
  role: ProfileRole
): Promise<string> {
  if (role === "verificador") {
    return "/verificacao";
  }
  if (role === "produtor") {
    const { data } = await admin
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    return data ? "/produtor/painel" : "/produtor";
  }
  const { data } = await admin
    .from("investor_answers")
    .select("investor_id")
    .eq("investor_id", userId)
    .maybeSingle();
  return data ? "/negocios" : "/descobrir/1";
}
