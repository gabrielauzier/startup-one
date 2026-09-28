/**
 * AD-007/RN-34/CA-34.2: URLs assinadas de documentos sensíveis são
 * geradas sob demanda, no momento da visualização, com TTL de 5
 * minutos - nunca pré-geradas ou cacheadas. Extraído de `actions.ts`
 * como uma função quase pura (só depende de uma interface mínima de
 * Storage, injetada) para poder ser testada com um client mockado -
 * o Supabase Storage local está desabilitado neste ambiente
 * ([storage] enabled = false em supabase/config.toml, mesmo gap
 * documentado desde o T22/T24: HealthCheckTimeoutError em
 * supabase_storage_web), então a geração real de URL assinada não
 * pode ser exercitada de ponta a ponta aqui - mas a lógica de bucket,
 * caminho e TTL corretos é testável e testada sem depender disso.
 */

export const DOCUMENTS_BUCKET = "documentos";
export const SIGNED_URL_TTL_SECONDS = 300;

export interface SignedUrlResponse {
  signedUrl: string;
}

export interface SignedUrlError {
  message: string;
}

export interface SignedUrlStorageClient {
  from(bucket: string): {
    createSignedUrl(
      path: string,
      expiresIn: number
    ): Promise<{ data: SignedUrlResponse | null; error: SignedUrlError | null }>;
  };
}

export interface CreateDocumentSignedUrlResult {
  ok: boolean;
  signedUrl?: string;
  expiresIn?: number;
  error?: string;
}

/**
 * CA-34.1/CA-34.2: gera a URL assinada de um documento sensível
 * (bucket `documentos`, TTL de 5 minutos/300s) - rejeita um
 * `storagePath` vazio antes de sequer chamar o Storage.
 */
export async function createDocumentSignedUrl(
  storage: SignedUrlStorageClient,
  storagePath: string
): Promise<CreateDocumentSignedUrlResult> {
  if (!storagePath || storagePath.trim().length === 0) {
    return { ok: false, error: "Caminho do documento inválido." };
  }

  const { data, error } = await storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Não foi possível gerar a URL assinada." };
  }

  return { ok: true, signedUrl: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS };
}
