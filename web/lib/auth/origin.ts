import { headers } from "next/headers";

/**
 * Origem publica da requisicao atual (atras da Vercel/proxy), usada para
 * montar o `emailRedirectTo`. O GoTrue so' aceita URLs de
 * `additional_redirect_urls`; qualquer outra cai no `site_url`.
 */
export async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const local = /^(localhost|127\.0\.0\.1)(:|$)/.test(host);
  const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return `${proto}://${host}`;
}
