import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const store = new Map<string, { value: string; options?: Record<string, unknown> }>();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (store.has(name) ? { name, value: store.get(name)!.value } : undefined),
    set: (name: string, value: string, options?: Record<string, unknown>) =>
      void store.set(name, { value, options }),
    delete: (name: string) => void store.delete(name),
  }),
}));

import {
  AUTH_CONTEXT_COOKIE,
  RECOVERY_COOKIE,
  clearAuthContext,
  clearRecoveryFlag,
  hasRecoveryFlag,
  readAuthContext,
  setAuthContext,
  setRecoveryFlag,
} from "../auth-context-cookie";

const asRequest = () => ({
  cookies: {
    get: (name: string) => (store.has(name) ? { value: store.get(name)!.value } : undefined),
  },
});

beforeEach(() => {
  store.clear();
  vi.stubEnv("AUTH_COOKIE_SECRET", "segredo-de-teste");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("cookie de contexto de auth (AD-010)", () => {
  it("devolve o e-mail normalizado de um cookie valido do mesmo kind", async () => {
    await setAuthContext({ email: " Foo@Bar.com ", kind: "reset" });

    expect(await readAuthContext("reset")).toEqual({ email: "foo@bar.com" });
  });

  it("devolve null para outro kind", async () => {
    await setAuthContext({ email: "foo@bar.com", kind: "reset" });

    expect(await readAuthContext("magic")).toBeNull();
  });

  it("devolve null para cookie adulterado", async () => {
    await setAuthContext({ email: "foo@bar.com", kind: "reset" });
    const original = store.get(AUTH_CONTEXT_COOKIE)!.value;
    const forged = Buffer.from(
      JSON.stringify({ email: "outro@bar.com", kind: "reset", exp: 9999999999 })
    ).toString("base64url");
    store.set(AUTH_CONTEXT_COOKIE, { value: `${forged}.${original.split(".")[1]}` });

    expect(await readAuthContext("reset")).toBeNull();
  });

  it("devolve null para cookie malformado ou ausente", async () => {
    expect(await readAuthContext("reset")).toBeNull();
    store.set(AUTH_CONTEXT_COOKIE, { value: "lixo" });
    expect(await readAuthContext("reset")).toBeNull();
  });

  it("expira depois de 15 minutos", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T10:00:00Z"));
    await setAuthContext({ email: "foo@bar.com", kind: "signup" });

    vi.setSystemTime(new Date("2026-10-02T10:14:59Z"));
    expect(await readAuthContext("signup")).toEqual({ email: "foo@bar.com" });

    vi.setSystemTime(new Date("2026-10-02T10:15:01Z"));
    expect(await readAuthContext("signup")).toBeNull();
  });

  it("e httpOnly, sameSite=lax, de 15 min e sem secure fora de producao", async () => {
    await setAuthContext({ email: "foo@bar.com", kind: "magic" });

    expect(store.get(AUTH_CONTEXT_COOKIE)!.options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      maxAge: 900,
      secure: false,
    });
  });

  it("e secure em producao", async () => {
    vi.stubEnv("NODE_ENV", "production");
    await setAuthContext({ email: "foo@bar.com", kind: "magic" });

    expect(store.get(AUTH_CONTEXT_COOKIE)!.options).toMatchObject({ secure: true });
  });

  it("clearAuthContext remove o cookie", async () => {
    await setAuthContext({ email: "foo@bar.com", kind: "magic" });
    await clearAuthContext();

    expect(await readAuthContext("magic")).toBeNull();
  });

  it("sem AUTH_COOKIE_SECRET em producao, assinar lanca erro explicito", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_COOKIE_SECRET", "");

    await expect(setAuthContext({ email: "foo@bar.com", kind: "magic" })).rejects.toThrow(
      "AUTH_COOKIE_SECRET"
    );
  });
});

describe("flag de recuperacao (AUTH-14 criterio 16)", () => {
  it("hasRecoveryFlag le a flag do request depois de setRecoveryFlag", async () => {
    expect(hasRecoveryFlag(asRequest())).toBe(false);

    await setRecoveryFlag();

    expect(hasRecoveryFlag(asRequest())).toBe(true);
    expect(store.get(RECOVERY_COOKIE)!.options).toMatchObject({ httpOnly: true, maxAge: 900 });
  });

  it("clearRecoveryFlag remove a flag", async () => {
    await setRecoveryFlag();
    await clearRecoveryFlag();

    expect(hasRecoveryFlag(asRequest())).toBe(false);
  });

  it("uma flag adulterada nao vale", () => {
    store.set(RECOVERY_COOKIE, { value: "eyJyZWNvdmVyeSI6dHJ1ZSwiZXhwIjo5OTk5OTk5OTk5fQ.assinatura-falsa" });

    expect(hasRecoveryFlag(asRequest())).toBe(false);
  });

  it("a flag expira depois de 15 minutos", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T10:00:00Z"));
    await setRecoveryFlag();

    vi.setSystemTime(new Date("2026-10-02T10:16:00Z"));
    expect(hasRecoveryFlag(asRequest())).toBe(false);
  });
});
