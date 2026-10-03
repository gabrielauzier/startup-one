import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { postAuthDestination } from "@/lib/auth/post-auth-server";
import { normalizeNext } from "@/lib/auth/redirect";
import { trackEvent } from "@/lib/analytics/track";

const EXPIRED_SIGNUP = "/cadastro/confirmar-email?erro=expirado";
const EXPIRED_LINK = "/entrar?erro=link-expirado";

/**
 * AUTH-04 / AUTH-07 (AD-009): troca o `token_hash` do e-mail (confirmacao
 * de cadastro ou magic link) por sessao, no servidor - funciona mesmo se o
 * link for aberto em outro aparelho/navegador. Aceita so' `signup` e
 * `email`; o reset de senha e' por codigo, nao por link.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  // Sem `emailRedirectTo` o GoTrue injeta o `site_url` (raiz): isso nao e'
  // um destino pedido, vale o destino padrao do papel.
  const requested = normalizeNext(searchParams.getAll("next"), origin);
  const next = requested === "/" ? null : requested;

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if ((type !== "signup" && type !== "email") || !tokenHash) {
    return redirectTo(EXPIRED_LINK);
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error || !data.user) {
    return redirectTo(type === "signup" ? EXPIRED_SIGNUP : EXPIRED_LINK);
  }

  try {
    await trackEvent({
      type: type === "signup" ? "auth_email_confirmado" : "auth_magic_link_ok",
      payload: {},
      atorId: data.user.id,
    });
  } catch {
    // Telemetria nunca bloqueia a entrada (AUTH-15.4).
  }

  return redirectTo(await postAuthDestination(data.user.id, next));
}
