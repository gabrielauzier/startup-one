import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { hashEmail } from "../email";

interface Row {
  key_hash: string;
  kind: string;
  created_at: string;
}

let rows: Row[] = [];

/** Fake minimo do query builder do Supabase para `auth_throttle`. */
function fakeAdmin() {
  return {
    from: () => ({
      select: () => {
        const filters: ((r: Row) => boolean)[] = [];
        const builder = {
          eq: (col: keyof Row, val: string) => {
            filters.push((r) => r[col] === val);
            return builder;
          },
          gte: (col: keyof Row, val: string) => {
            filters.push((r) => r[col] >= val);
            return builder;
          },
          order: async () => ({
            data: rows
              .filter((r) => filters.every((f) => f(r)))
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .map((r) => ({ created_at: r.created_at })),
          }),
        };
        return builder;
      },
      insert: async (row: { key_hash: string; kind: string }) => {
        rows.push({ ...row, created_at: new Date().toISOString() });
        return { error: null };
      },
      delete: () => ({
        lt: async (_col: string, val: string) => {
          rows = rows.filter((r) => r.created_at >= val);
          return { error: null };
        },
      }),
    }),
  };
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => fakeAdmin() }));

import { checkAndRecordSend } from "../throttle";

beforeEach(() => {
  rows = [];
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-02T10:00:00Z"));
});

afterEach(() => vi.useRealTimers());

const advance = (seconds: number) =>
  vi.setSystemTime(new Date(Date.now() + seconds * 1000));

describe("checkAndRecordSend (AUTH-09)", () => {
  it("permite o primeiro envio e grava uma linha com o hash do e-mail", async () => {
    const result = await checkAndRecordSend("Foo@Bar.com", "reset");

    expect(result).toEqual({ allowed: true });
    expect(rows).toHaveLength(1);
    expect(rows[0].key_hash).toBe(hashEmail("foo@bar.com"));
    expect(rows[0].kind).toBe("reset");
  });

  it("bloqueia um segundo envio dentro de 60 s e informa quanto falta", async () => {
    await checkAndRecordSend("foo@bar.com", "reset");
    advance(20);

    expect(await checkAndRecordSend("foo@bar.com", "reset")).toEqual({
      allowed: false,
      reason: "cooldown",
      retryAfterSec: 40,
    });
    expect(rows).toHaveLength(1);
  });

  it("permite o segundo envio depois de 60 s", async () => {
    await checkAndRecordSend("foo@bar.com", "reset");
    advance(61);

    expect(await checkAndRecordSend("foo@bar.com", "reset")).toEqual({ allowed: true });
  });

  it("bloqueia o 4o envio na mesma hora (teto de 3) e informa o tempo ate liberar", async () => {
    for (let i = 0; i < 3; i += 1) {
      expect(await checkAndRecordSend("foo@bar.com", "magic")).toEqual({ allowed: true });
      advance(61);
    }

    expect(await checkAndRecordSend("foo@bar.com", "magic")).toEqual({
      allowed: false,
      reason: "hourly-cap",
      retryAfterSec: 3600 - 3 * 61,
    });
    expect(rows).toHaveLength(3);
  });

  it("volta a permitir depois que o envio mais antigo sai da janela de 1 h", async () => {
    for (let i = 0; i < 3; i += 1) {
      await checkAndRecordSend("foo@bar.com", "magic");
      advance(61);
    }
    advance(3600);

    expect(await checkAndRecordSend("foo@bar.com", "magic")).toEqual({ allowed: true });
  });

  it("kinds e e-mails diferentes nao interferem", async () => {
    await checkAndRecordSend("foo@bar.com", "reset");

    expect(await checkAndRecordSend("foo@bar.com", "signup")).toEqual({ allowed: true });
    expect(await checkAndRecordSend("outro@bar.com", "reset")).toEqual({ allowed: true });
  });

  it("remove linhas com mais de 1 h ao gravar", async () => {
    rows.push({
      key_hash: hashEmail("velho@bar.com"),
      kind: "reset",
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    });

    await checkAndRecordSend("foo@bar.com", "reset");

    expect(rows.map((r) => r.key_hash)).toEqual([hashEmail("foo@bar.com")]);
  });
});
