import { createAdminClient } from "@/lib/supabase/admin";

export type EntrarRole = "investidor" | "empresa" | "produtor";
export type ProfileRole = EntrarRole | "verificador";

type AdminClient = ReturnType<typeof createAdminClient>;

/** Telas de auth: nunca sao destino valido de redirect (evita loop). */
const AUTH_PATH_PREFIXES = [
  "/entrar",
  "/cadastro",
  "/esqueci-senha",
  "/redefinir-senha",
  "/completar-perfil",
];

function isSafePath(path: string): boolean {
  // So' caminho interno: `/x`. Bloqueia `//host` e `/\host` (navegadores
  // tratam `\` como `/`) e caracteres de controle.
  if (!path.startsWith("/")) return false;
  if (path[1] === "/" || path[1] === "\\") return false;
  if (/[\u0000-\u001f\u007f]/.test(path)) return false;

  const pathname = path.split(/[?#]/)[0];
  if (pathname.startsWith("/auth/")) return false;
  return !AUTH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * RN-56 / AUTH-01: so' aceita caminhos internos relativos, ja
 * validados tambem depois de decodificar uma vez (`/%5Cevil.com`), e
 * que nao sejam telas de auth.
 */
export function isSafeRedirect(path: string): boolean {
  if (!isSafePath(path)) return false;
  try {
    return isSafePath(decodeURIComponent(path));
  } catch {
    return false;
  }
}

/**
 * `next` vindo do link de e-mail: o GoTrue injeta `{{ .RedirectTo }}`
 * como URL absoluta (URL-encoded). Aceita um caminho interno ou uma URL
 * da mesma origem, usa o primeiro valor de uma lista e devolve so'
 * `pathname + search` quando seguro; senao `null`.
 */
export function normalizeNext(
  raw: string | string[] | null | undefined,
  origin: string
): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;

  let candidate = value;
  if (!value.startsWith("/")) {
    try {
      const url = new URL(value);
      if (url.origin !== origin) return null;
      candidate = url.pathname + url.search;
    } catch {
      return null;
    }
  }
  return isSafeRedirect(candidate) ? candidate : null;
}

/**
 * `searchParams` do Next entrega `string | string[]`: um parametro repetido
 * (`?redirect=/a&redirect=/b`) vale pelo primeiro valor (edge case da spec).
 */
export function firstParam(value: string | string[] | undefined): string {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === "string" ? first : "";
}

/** Pagina inicial estatica do papel (usada pelo `proxy`, sem consulta a banco). */
export function roleHome(role: ProfileRole): string {
  if (role === "verificador") return "/verificacao";
  if (role === "produtor") return "/produtor";
  return "/negocios";
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
