"use server";

import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DOCUMENTS_BUCKET } from "@/lib/documents/signed-url";

export type DocumentoAdicionalTipo = "laudo" | "certificado_completo";

const TITULOS: Record<DocumentoAdicionalTipo, string> = {
  laudo: "Laudo ambiental",
  certificado_completo: "Certificado completo",
};

async function requireOwnBusiness(): Promise<
  | { ok: true; userId: string; businessId: string }
  | { ok: false; error: string }
> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Entre novamente." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "produtor") {
    return { ok: false, error: "Só a produtora pode enviar documentos adicionais." };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!business) {
    return { ok: false, error: "Cadastro não encontrado." };
  }

  return { ok: true, userId: user.id, businessId: business.id };
}

export interface CreateDocumentUploadUrlResult {
  ok: boolean;
  error?: string;
  path?: string;
  signedUrl?: string;
}

/**
 * RF-25: gera uma URL assinada de upload (mesmo bucket `documentos`
 * usado pelo visualizador, T42, `lib/documents/signed-url.ts`) para a
 * produtora anexar laudo ambiental ou certificado completo depois do
 * cadastro inicial. `grupo` aqui é o `tipo` do documento
 * (`DocumentoAdicionalTipo`) - reaproveita a assinatura genérica de
 * `PhotoUploaderProps.createUploadUrlFn` (components/upload/PhotoUploader.tsx,
 * adaptado neste task para aceitar funções de upload injetadas).
 */
export async function createDocumentUploadUrl(
  businessId: string,
  grupo: string,
  fileName: string
): Promise<CreateDocumentUploadUrlResult> {
  const auth = await requireOwnBusiness();
  if (!auth.ok) return auth;
  if (auth.businessId !== businessId) {
    return { ok: false, error: "Cadastro não encontrado." };
  }
  if (grupo !== "laudo" && grupo !== "certificado_completo") {
    return { ok: false, error: "Tipo de documento inválido." };
  }

  const path = `${businessId}/adicionais/${grupo}/${Date.now()}-${fileName}`;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(DOCUMENTS_BUCKET).createSignedUploadUrl(path);

  if (error || !data) {
    return { ok: false, error: "Não foi possível preparar o envio. Tente de novo." };
  }

  return { ok: true, path: data.path, signedUrl: data.signedUrl };
}

export interface ConfirmDocumentUploadResult {
  ok: boolean;
  error?: string;
}

/**
 * RF-25: registra o documento adicional em `documents` depois do
 * upload confirmado - aparece na aba Documentos do negócio (T41) com
 * a situação "Precisa de liberação" (não é aberto a todos), pronto
 * para um investidor solicitar acesso.
 */
export async function confirmDocumentUpload(
  businessId: string,
  grupo: string,
  path: string,
  mime: string,
  tamanho: number
): Promise<ConfirmDocumentUploadResult> {
  void mime;
  void tamanho;

  const auth = await requireOwnBusiness();
  if (!auth.ok) return auth;
  if (auth.businessId !== businessId) {
    return { ok: false, error: "Cadastro não encontrado." };
  }
  if (grupo !== "laudo" && grupo !== "certificado_completo") {
    return { ok: false, error: "Tipo de documento inválido." };
  }

  // `documents` só tem policy de SELECT (T39) - a intenção desde a
  // migração era escrever por cliente admin, mesmo padrão já usado
  // por `evidences`/`certifications` (confirmEvidence,
  // cadastro/4/actions.ts) - a produtora já foi autenticada e
  // confirmada dona do negócio acima (requireOwnBusiness).
  const admin = createAdminClient();
  const { error } = await admin.from("documents").insert({
    business_id: businessId,
    titulo: TITULOS[grupo],
    tipo: grupo,
    storage_path: path,
    aberto_a_todos: false,
  });

  if (error) {
    return { ok: false, error: "Não foi possível salvar o documento. Tente de novo." };
  }

  return { ok: true };
}

export interface DocumentoAdicionalRow {
  id: string;
  titulo: string;
  tipo: string;
}

export async function listDocumentosAdicionais(businessId: string): Promise<DocumentoAdicionalRow[]> {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("documents")
    .select("id, titulo, tipo")
    .eq("business_id", businessId)
    .in("tipo", ["laudo", "certificado_completo"]);

  return (data as DocumentoAdicionalRow[] | null) ?? [];
}
