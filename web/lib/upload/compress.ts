/**
 * RN-09/CA-09.1: comprime uma foto no aparelho antes do upload, para o
 * lado maior nunca passar de `maxDimension` (1.600px por padrão).
 * Fotos ja' menores que o limite sao redimensionadas para o mesmo
 * tamanho (sem upscale), preservando a proporcao original.
 */
export const MAX_DIMENSION = 1600;

export interface CompressResult {
  blob: Blob;
  width: number;
  height: number;
}

export async function compressImage(
  file: File,
  maxDimension: number = MAX_DIMENSION
): Promise<CompressResult> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const largestSide = Math.max(width, height);
  const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;

  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Não foi possível preparar a imagem para envio.");
  }
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Não foi possível gerar a imagem comprimida."));
      },
      outputType,
      0.85
    );
  });

  return { blob, width: targetWidth, height: targetHeight };
}
