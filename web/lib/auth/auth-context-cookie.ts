import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { normalizeEmail } from "./email";

export type AuthContextKind = "signup" | "magic" | "reset";

export const AUTH_CONTEXT_COOKIE = "iasy_auth_ctx";
export const RECOVERY_COOKIE = "iasy_recovery";

const TTL_SECONDS = 15 * 60;

function secret(): string {
  const value = process.env.AUTH_COOKIE_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_COOKIE_SECRET nao configurada");
  }
  return "dev-only-auth-cookie-secret";
}

function mac(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

function sign(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${mac(body)}`;
}

function verify<T extends { exp: number }>(raw: string | undefined): T | null {
  if (!raw) return null;
  const [body, signature, ...rest] = raw.split(".");
  if (!body || !signature || rest.length > 0) return null;

  const expected = Buffer.from(mac(body));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as T;
    if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SECONDS,
  };
}

const expiry = () => Math.floor(Date.now() / 1000) + TTL_SECONDS;

interface ContextPayload {
  email: string;
  kind: AuthContextKind;
  exp: number;
}

/** AD-010: o e-mail entre telas de auth viaja neste cookie, nunca na URL. */
export async function setAuthContext(input: {
  email: string;
  kind: AuthContextKind;
}): Promise<void> {
  const store = await cookies();
  const payload: ContextPayload = {
    email: normalizeEmail(input.email),
    kind: input.kind,
    exp: expiry(),
  };
  store.set(AUTH_CONTEXT_COOKIE, sign(payload), cookieOptions());
}

export async function readAuthContext(
  kind: AuthContextKind
): Promise<{ email: string } | null> {
  const store = await cookies();
  const payload = verify<ContextPayload>(store.get(AUTH_CONTEXT_COOKIE)?.value);
  if (!payload || payload.kind !== kind) return null;
  return { email: payload.email };
}

export async function clearAuthContext(): Promise<void> {
  (await cookies()).delete(AUTH_CONTEXT_COOKIE);
}

/** Sessao de recuperacao: so' pode ir a /redefinir-senha ate trocar a senha. */
export async function setRecoveryFlag(): Promise<void> {
  const store = await cookies();
  store.set(RECOVERY_COOKIE, sign({ recovery: true, exp: expiry() }), cookieOptions());
}

export async function clearRecoveryFlag(): Promise<void> {
  (await cookies()).delete(RECOVERY_COOKIE);
}

/** Usada pelo `proxy`: le o cookie direto do `NextRequest`. */
export function hasRecoveryFlag(request: {
  cookies: { get(name: string): { value: string } | undefined };
}): boolean {
  return verify<{ recovery: boolean; exp: number }>(request.cookies.get(RECOVERY_COOKIE)?.value)?.recovery === true;
}
