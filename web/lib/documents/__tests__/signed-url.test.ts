import { describe, expect, it, vi } from "vitest";
import {
  createDocumentSignedUrl,
  DOCUMENTS_BUCKET,
  SIGNED_URL_TTL_SECONDS,
  type SignedUrlStorageClient,
} from "../signed-url";

function mockStorage(
  impl: (
    path: string,
    expiresIn: number
  ) => Promise<{ data: { signedUrl: string } | null; error: { message: string } | null }>
): { client: SignedUrlStorageClient; createSignedUrl: ReturnType<typeof vi.fn> } {
  const createSignedUrl = vi.fn(impl);
  const client: SignedUrlStorageClient = {
    from: (bucket: string) => {
      expect(bucket).toBe(DOCUMENTS_BUCKET);
      return { createSignedUrl };
    },
  };
  return { client, createSignedUrl };
}

describe("createDocumentSignedUrl", () => {
  it("AD-007/CA-34.2: chama createSignedUrl no bucket certo, com o path e TTL de 300s (5 min)", async () => {
    const { client, createSignedUrl } = mockStorage(async () => ({
      data: { signedUrl: "https://storage.local/signed?x=1" },
      error: null,
    }));

    const result = await createDocumentSignedUrl(client, "negocio-1/car.pdf");

    expect(SIGNED_URL_TTL_SECONDS).toBe(300);
    expect(createSignedUrl).toHaveBeenCalledWith("negocio-1/car.pdf", 300);
    expect(result).toEqual({
      ok: true,
      signedUrl: "https://storage.local/signed?x=1",
      expiresIn: 300,
    });
  });

  it("rejeita um storage_path vazio sem chamar o Storage", async () => {
    const { client, createSignedUrl } = mockStorage(async () => ({
      data: { signedUrl: "nao-deveria-chegar-aqui" },
      error: null,
    }));

    const result = await createDocumentSignedUrl(client, "");

    expect(result.ok).toBe(false);
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("propaga o erro do Storage sem lançar exceção (ex.: Storage indisponível)", async () => {
    const { client } = mockStorage(async () => ({
      data: null,
      error: { message: "name resolution failed" },
    }));

    const result = await createDocumentSignedUrl(client, "negocio-1/car.pdf");

    expect(result.ok).toBe(false);
    expect(result.error).toBe("name resolution failed");
  });
});
