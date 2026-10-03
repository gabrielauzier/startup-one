import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { resolveAccess, type Role } from "@/lib/auth/roles";
import { roleHome } from "@/lib/auth/redirect";
import { hasRecoveryFlag } from "@/lib/auth/auth-context-cookie";

interface Session {
  userId: string | null;
  role: Role | null;
}

async function getSession(request: NextRequest): Promise<Session> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {
          // Refresh do cookie ja e' feito por updateSession(); esta
          // instancia so le a sessao para descobrir o papel do usuario.
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, role: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, role: (profile?.role as Role) ?? null };
}

/** Telas de entrada: usuario logado sem perfil e' levado a /completar-perfil. */
const AUTH_ENTRY = /^\/(entrar|cadastro|esqueci-senha)(\/|$)/;

/** AUTH-14: durante a sessao de recuperacao so' estas rotas estao liberadas. */
const RECOVERY_ALLOWED = /^\/(redefinir-senha|esqueci-senha|auth\/)/;

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  const { pathname, search } = request.nextUrl;
  const { userId, role } = await getSession(request);

  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (userId && hasRecoveryFlag(request) && !RECOVERY_ALLOWED.test(pathname)) {
    return redirectTo("/redefinir-senha");
  }

  const access = resolveAccess(pathname, role);
  const isPrivate = !resolveAccess(pathname, null).allowed;

  // AUTH-11: logado sem linha em `profiles` (usuario "orfao").
  if (
    userId &&
    !role &&
    (isPrivate || AUTH_ENTRY.test(pathname)) &&
    !pathname.startsWith("/completar-perfil")
  ) {
    return redirectTo("/completar-perfil");
  }

  if (access.allowed) {
    return response;
  }

  if (access.reason === "no-session") {
    const entrarUrl = new URL("/entrar", request.url);
    entrarUrl.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(entrarUrl);
  }

  // AUTH-01: papel errado em pagina vai para a pagina inicial do papel
  // (nunca JSON cru); o 403 JSON fica so' para a API.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const home = new URL(roleHome(role!), request.url);
  home.searchParams.set("aviso", "sem-permissao");
  return NextResponse.redirect(home);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
