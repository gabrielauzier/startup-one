import { describe, it, expect } from "vitest";
import { validateEvidenceFile } from "../validate";

function makeFile(sizeBytes: number, type: string): File {
  return new File([new Uint8Array(sizeBytes)], "arquivo", { type });
}

describe("validateEvidenceFile (RN-08, CA-08.3)", () => {
  it("aceita JPG/PNG/HEIC/PDF ate 10MB", () => {
    expect(validateEvidenceFile(makeFile(1024, "image/jpeg"))).toEqual({ ok: true });
    expect(validateEvidenceFile(makeFile(1024, "image/png"))).toEqual({ ok: true });
    expect(validateEvidenceFile(makeFile(1024, "image/heic"))).toEqual({ ok: true });
    expect(validateEvidenceFile(makeFile(1024, "application/pdf"))).toEqual({ ok: true });
  });

  it("recusa arquivo de 12MB com a mensagem do limite (CA-08.3)", () => {
    const result = validateEvidenceFile(makeFile(12 * 1024 * 1024, "image/jpeg"));
    expect(result).toEqual({
      ok: false,
      error: "O arquivo passa de 10 MB. Envie um arquivo menor.",
    });
  });

  it("recusa .docx com a mensagem do formato (CA-08.3)", () => {
    const result = validateEvidenceFile(
      makeFile(
        1024,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    );
    expect(result).toEqual({
      ok: false,
      error: "Formato não aceito. Envie um arquivo JPG, PNG, HEIC ou PDF.",
    });
  });
});
