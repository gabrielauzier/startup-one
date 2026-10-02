import { describe, it, expect, vi, beforeEach } from "vitest";
import { compressImage } from "../compress";

interface FakeBitmap {
  width: number;
  height: number;
}

function fakeFile(type = "image/jpeg"): File {
  return new File([new Uint8Array([1, 2, 3])], "foto.jpg", { type });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

function stubImageBitmap(width: number, height: number) {
  vi.stubGlobal(
    "createImageBitmap",
    vi.fn(async (): Promise<FakeBitmap> => ({ width, height }))
  );
}

function stubCanvas() {
  const canvasStub = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ({
      drawImage: vi.fn(),
    })),
    toBlob: vi.fn(
      (cb: (blob: Blob | null) => void, type: string) => {
        cb(new Blob(["fake"], { type }));
      }
    ),
  };

  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") {
      return canvasStub as unknown as HTMLCanvasElement;
    }
    return originalCreateElement(tag);
  });

  return canvasStub;
}

describe("compressImage (RN-09, CA-09.1)", () => {
  it("reduz uma foto de 4000px para o lado maior de ate 1600px", async () => {
    stubImageBitmap(4000, 3000);
    const canvas = stubCanvas();

    const result = await compressImage(fakeFile());

    expect(Math.max(result.width, result.height)).toBeLessThanOrEqual(1600);
    expect(result.width).toBe(1600);
    expect(result.height).toBe(1200);
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
  });

  it("nao aumenta uma foto ja menor que o limite", async () => {
    stubImageBitmap(800, 600);
    stubCanvas();

    const result = await compressImage(fakeFile());

    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it("preserva a proporcao original ao reduzir", async () => {
    stubImageBitmap(3200, 1600);
    stubCanvas();

    const result = await compressImage(fakeFile());

    expect(result.width).toBe(1600);
    expect(result.height).toBe(800);
  });
});
