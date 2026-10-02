import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const createSupabaseBrowserClientMock = vi.fn().mockReturnValue({ auth: {} });

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createSupabaseBrowserClientMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
});

describe("createBrowserClient", () => {
  it("cria o cliente so com as variaveis publicas (URL e anon key)", async () => {
    const { createBrowserClient } = await import("../client");

    createBrowserClient();

    expect(createSupabaseBrowserClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key"
    );
  });

  it("nunca referencia a chave de servico no codigo-fonte (RNF-05)", () => {
    const source = readFileSync(
      path.join(__dirname, "..", "client.ts"),
      "utf-8"
    );

    expect(source).not.toMatch(/SERVICE_ROLE/i);
  });
});
