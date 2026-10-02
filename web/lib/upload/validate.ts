/**
 * RN-08/CA-08.3: formatos aceitos (JPG, PNG, HEIC, PDF), ate' 10 MB por
 * arquivo. Um arquivo maior ou em outro formato e' recusado com a
 * mensagem do limite ou do formato correspondente.
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/pdf",
];

export type FileValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateEvidenceFile(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: "O arquivo passa de 10 MB. Envie um arquivo menor." };
  }
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return {
      ok: false,
      error: "Formato não aceito. Envie um arquivo JPG, PNG, HEIC ou PDF.",
    };
  }
  return { ok: true };
}
