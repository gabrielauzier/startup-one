// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

let session: { user: { id: string } | null; profile: { role: string } | null } = {
  user: null,
  profile: null,
};

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: session.user } }) },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: session.profile }) }),
      }),
    }),
  }),
}));

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: async () => NextResponse.next(),
}));

const cookieJar = new Map<string, string>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: (name: string, value: string) => void cookieJar.set(name, value),
    delete: (name: string) => void cookieJar.delete(name),
    get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined),
  }),
}));

import { proxy } from "../proxy";
import { RECOVERY_COOKIE, setRecoveryFlag } from "@/lib/auth/auth-context-cookie";

const BASE = "http://localhost:3000";

async function run(path: string, cookie?: string) {
  const request = new NextRequest(`${BASE}${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
  return proxy(request);
}

function location(res: Response) {
  const header = res.headers.get("location");
  return header ? header.replace(BASE, "") : null;
}

const logged = (role: string | null) => {
  session = { user: { id: "u1" }, profile: role ? { role } : null };
};

beforeEach(() => {
  session = { user: null, profile: null };
  cookieJar.clear();
});

describe("proxy: sem sessao (CA-02.3)", () => {
  it("rota privada redireciona a /entrar com o redirect", async () => {
    const res = await run("/produtor/painel?x=1");

    expect(res.status).toBe(307);
    expect(location(res)).toBe("/entrar?redirect=%2Fprodutor%2Fpainel%3Fx%3D1");
  });

  it("rota publica e /produtor (boas-vindas) passam", async () => {
    for (const path of ["/", "/negocios", "/produtor", "/entrar"]) {
      const res = await run(path);
      expect(res.headers.get("location"), path).toBeNull();
      expect(res.status, path).toBe(200);
    }
  });
});

describe("proxy: logado sem perfil (AUTH-11, critério 8)", () => {
  it.each(["/produtor/painel", "/interesses", "/entrar", "/cadastro", "/esqueci-senha"])(
    "%s redireciona a /completar-perfil",
    async (path) => {
      logged(null);

      expect(location(await run(path))).toBe("/completar-perfil");
    }
  );

  it("/completar-perfil e rota publica comum nao entram em loop", async () => {
    logged(null);

    for (const path of ["/completar-perfil", "/negocios", "/"]) {
      expect((await run(path)).headers.get("location"), path).toBeNull();
    }
  });
});

describe("proxy: papel errado (AUTH-01, critérios 7 e 7a)", () => {
  it("investidor em /produtor/painel vai a /negocios?aviso=sem-permissao", async () => {
    logged("investidor");

    expect(location(await run("/produtor/painel"))).toBe("/negocios?aviso=sem-permissao");
  });

  it("empresa em /verificacao vai a /negocios?aviso=sem-permissao", async () => {
    logged("empresa");

    expect(location(await run("/verificacao"))).toBe("/negocios?aviso=sem-permissao");
  });

  it("produtor em /interesses vai a /produtor?aviso=sem-permissao", async () => {
    logged("produtor");

    expect(location(await run("/interesses"))).toBe("/produtor?aviso=sem-permissao");
  });

  it("verificador em /produtor/painel vai a /verificacao?aviso=sem-permissao", async () => {
    logged("verificador");

    expect(location(await run("/produtor/painel"))).toBe("/verificacao?aviso=sem-permissao");
  });

  it("papel certo passa", async () => {
    logged("produtor");

    const res = await run("/produtor/painel");
    expect(res.headers.get("location")).toBeNull();
    expect(res.status).toBe(200);
  });
});

describe("proxy: sessao de recuperacao (AUTH-14, critério 16)", () => {
  async function recoveryCookie() {
    await setRecoveryFlag();
    return `${RECOVERY_COOKIE}=${cookieJar.get(RECOVERY_COOKIE)}`;
  }

  it("com a flag, rota privada ou publica vai a /redefinir-senha", async () => {
    logged("investidor");
    const cookie = await recoveryCookie();

    expect(location(await run("/negocios", cookie))).toBe("/redefinir-senha");
    expect(location(await run("/interesses", cookie))).toBe("/redefinir-senha");
  });

  it("com a flag, /redefinir-senha, /esqueci-senha/codigo e /auth/confirm passam", async () => {
    logged("investidor");
    const cookie = await recoveryCookie();

    for (const path of ["/redefinir-senha", "/esqueci-senha/codigo", "/auth/confirm"]) {
      expect((await run(path, cookie)).headers.get("location"), path).toBeNull();
    }
  });

  it("sem sessao a flag nao tem efeito", async () => {
    const cookie = await recoveryCookie();

    expect((await run("/negocios", cookie)).headers.get("location")).toBeNull();
  });
});

describe("proxy: API", () => {
  it("rota /api/* e publica para o proxy (cron usa Bearer proprio)", async () => {
    logged("investidor");

    const res = await run("/api/cron/expire-drafts");
    expect(res.status).toBe(200);
  });
});
