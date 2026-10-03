// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const verifyOtp = vi.fn();
const postAuthDestination = vi.fn(async (...a: unknown[]) => (a.length >= 0 ? "/produtor" : ""));
const trackEvent = vi.fn(async (...a: unknown[]) => ({ ok: a.length >= 0 }));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: async () => ({ auth: { verifyOtp } }),
}));
vi.mock("@/lib/auth/post-auth-server", () => ({
  postAuthDestination: (...a: unknown[]) => postAuthDestination(...a),
}));
vi.mock("@/lib/analytics/track", () => ({ trackEvent: (...a: unknown[]) => trackEvent(...a) }));

import { GET } from "../route";

const BASE = "http://localhost:3000";
const call = (query: string) => GET(new NextRequest(`${BASE}/auth/confirm?${query}`));
const location = (res: Response) => res.headers.get("location")?.replace(BASE, "");

beforeEach(() => {
  vi.clearAllMocks();
  verifyOtp.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
});

describe("GET /auth/confirm (AUTH-04, AUTH-07)", () => {
  it.each(["signup", "email"] as const)(
    "token valido type=%s cria a sessao e redireciona pelo destino pos-autenticacao",
    async (type) => {
      const res = await call(`token_hash=abc&type=${type}`);

      expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "abc", type });
      expect(postAuthDestination).toHaveBeenCalledWith("user-1", null);
      expect(location(res)).toBe("/produtor");
    }
  );

  it("honra o next seguro da mesma origem (URL absoluta e URL-encoded, como o GoTrue injeta)", async () => {
    await call(`token_hash=abc&type=email&next=${encodeURIComponent(`${BASE}/negocios/x?y=1`)}`);

    expect(postAuthDestination).toHaveBeenCalledWith("user-1", "/negocios/x?y=1");
  });

  it("next que e' so' a raiz (site_url injetado pelo GoTrue sem emailRedirectTo) nao conta como destino pedido", async () => {
    await call(`token_hash=abc&type=email&next=${encodeURIComponent(`${BASE}/`)}`);

    expect(postAuthDestination).toHaveBeenCalledWith("user-1", null);
  });

  it.each([
    "http://evil.com/negocios",
    "//evil.com",
    `${BASE}/entrar`,
    "/\\evil.com",
  ])("ignora next inseguro %s", async (next) => {
    await call(`token_hash=abc&type=email&next=${encodeURIComponent(next)}`);

    expect(postAuthDestination).toHaveBeenCalledWith("user-1", null);
  });

  it("token invalido, vencido ou usado em type=signup vai a /cadastro/confirmar-email?erro=expirado", async () => {
    verifyOtp.mockResolvedValueOnce({ data: { user: null }, error: { message: "expired" } });

    expect(location(await call("token_hash=abc&type=signup"))).toBe(
      "/cadastro/confirmar-email?erro=expirado"
    );
    expect(postAuthDestination).not.toHaveBeenCalled();
  });

  it("token invalido, vencido ou usado em type=email vai a /entrar?erro=link-expirado", async () => {
    verifyOtp.mockResolvedValueOnce({ data: { user: null }, error: { message: "used" } });

    expect(location(await call("token_hash=abc&type=email"))).toBe("/entrar?erro=link-expirado");
  });

  it.each(["recovery", "magiclink", "invite", ""])(
    "type=%j e tratado como invalido sem chamar o Supabase",
    async (type) => {
      expect(location(await call(`token_hash=abc&type=${type}`))).toBe("/entrar?erro=link-expirado");
      expect(verifyOtp).not.toHaveBeenCalled();
    }
  );

  it("sem token_hash e invalido", async () => {
    expect(location(await call("type=signup"))).toBe("/entrar?erro=link-expirado");
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("registra auth_email_confirmado (signup) e auth_magic_link_ok (email) sem PII", async () => {
    await call("token_hash=abc&type=signup");
    await call("token_hash=abc&type=email");

    expect(trackEvent).toHaveBeenNthCalledWith(1, {
      type: "auth_email_confirmado",
      payload: {},
      atorId: "user-1",
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, {
      type: "auth_magic_link_ok",
      payload: {},
      atorId: "user-1",
    });
  });

  it("falha no evento nao impede a entrada", async () => {
    trackEvent.mockRejectedValueOnce(new Error("boom"));

    expect(location(await call("token_hash=abc&type=email"))).toBe("/produtor");
  });
});
