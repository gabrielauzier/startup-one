import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { resolveAccess, type Role } from "@/lib/auth/roles";

async function getRole(request: NextRequest): Promise<Role | null> {
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
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (profile?.role as Role) ?? null;
}

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  const { pathname, search } = request.nextUrl;
  const role = await getRole(request);
  const access = resolveAccess(pathname, role);

  if (access.allowed) {
    return response;
  }

  if (access.reason === "no-session") {
    const entrarUrl = new URL("/entrar", request.url);
    entrarUrl.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(entrarUrl);
  }

  return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
