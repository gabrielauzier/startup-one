import { describe, it, expect, vi, beforeEach } from "vitest";

const getUserMock = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
const createSupabaseServerClientMock = vi.fn().mockReturnValue({
  auth: { getUser: getUserMock },
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: createSupabaseServerClientMock,
}));

const cookieStoreMock = {
  getAll: vi.fn().mockReturnValue([{ name: "sb-token", value: "abc" }]),
  set: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(cookieStoreMock),
}));

beforeEach(() => {
  vi.clearAllMocks();
  createSupabaseServerClientMock.mockReturnValue({ auth: { getUser: getUserMock } });
  cookieStoreMock.getAll.mockReturnValue([{ name: "sb-token", value: "abc" }]);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
});

describe("createServerClient", () => {
  it("le a sessao dos cookies da requisicao e expoe auth.getUser()", async () => {
    const { createServerClient } = await import("../server");

    const client = await createServerClient();

    expect(createSupabaseServerClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "anon-key",
      expect.objectContaining({ cookies: expect.any(Object) })
    );

    const [, , options] = createSupabaseServerClientMock.mock.calls[0];
    expect(options.cookies.getAll()).toEqual([{ name: "sb-token", value: "abc" }]);

    await client.auth.getUser();
    expect(getUserMock).toHaveBeenCalledTimes(1);
  });

  it("nao lanca erro quando setAll e' chamado fora de uma Server Action", async () => {
    cookieStoreMock.set.mockImplementation(() => {
      throw new Error("cookies() foi chamado num Server Component");
    });
    const { createServerClient } = await import("../server");
    await createServerClient();

    const [, , options] = createSupabaseServerClientMock.mock.calls[0];
    expect(() =>
      options.cookies.setAll([{ name: "sb-token", value: "novo", options: {} }])
    ).not.toThrow();
  });
});
