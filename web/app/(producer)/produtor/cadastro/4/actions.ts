"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveBusinessForOwner } from "@/lib/business/draft";
import { saveDraftPart } from "../actions";

export type EvidenceGroup = "onde_produz" | "produto" | "terra" | "selo";

const STORAGE_BUCKET = "evidences";

export interface CreateUploadUrlResult {
  ok: boolean;
  error?: string;
  path?: string;
  signedUrl?: string;
  token?: string;
}

/**
 * RF-09/RN-09: gera uma URL assinada de upload (Supabase Storage) para
 * o cliente enviar a foto/documento ja' comprimido diretamente ao
 * bucket, sem passar o arquivo pelo servidor da aplicacao.
 */
export async function createUploadUrl(
  businessId: string,
  grupo: EvidenceGroup,
  fileName: string
): Promise<CreateUploadUrlResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Entre novamente." };
  }

  const admin = createAdminClient();
  const business = await getActiveBusinessForOwner(admin, user.id);
  if (!business || business.id !== businessId) {
    return { ok: false, error: "Cadastro não encontrado." };
  }

  const path = `${businessId}/${grupo}/${Date.now()}-${fileName}`;
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return { ok: false, error: "Não foi possível preparar o envio. Tente de novo." };
  }

  return { ok: true, path: data.path, signedUrl: data.signedUrl, token: data.token };
}

export interface ConfirmEvidenceResult {
  ok: boolean;
  error?: string;
}

/** RF-09: registra a evidência em `evidences` depois do upload confirmado. */
export async function confirmEvidence(
  businessId: string,
  grupo: EvidenceGroup,
  path: string,
  mime: string,
  tamanho: number
): Promise<ConfirmEvidenceResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Entre novamente." };
  }

  const admin = createAdminClient();
  const business = await getActiveBusinessForOwner(admin, user.id);
  if (!business || business.id !== businessId) {
    return { ok: false, error: "Cadastro não encontrado." };
  }

  const { error } = await admin.from("evidences").insert({
    business_id: businessId,
    grupo,
    storage_path: path,
    mime,
    tamanho,
  });

  if (error) {
    return { ok: false, error: "Não foi possível salvar o arquivo. Tente de novo." };
  }

  return { ok: true };
}

export interface EvidenceRow {
  id: string;
  grupo: EvidenceGroup;
  storage_path: string;
}

export async function listEvidences(businessId: string): Promise<EvidenceRow[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("evidences")
    .select("id, grupo, storage_path")
    .eq("business_id", businessId);

  return (data as EvidenceRow[] | null) ?? [];
}

export interface Parte4State {
  error?: string;
  field?: string;
}

/**
 * RF-09/RN-08/CA-08.1: ao menos 1 foto de onde produzem e 1 do produto
 * sao obrigatorias para avancar. Documento da terra e selos sao
 * opcionais nesta etapa (RN-08: a terra pode ir depois, mas o selo so'
 * e' concedido com ela).
 */
export async function submitParte4(
  prevState: Parte4State,
  formData: FormData
): Promise<Parte4State> {
  void prevState;
  void formData;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const admin = createAdminClient();
  const business = await getActiveBusinessForOwner(admin, user.id);
  if (!business) {
    redirect("/produtor");
  }

  const evidences = await listEvidences(business.id);
  const hasOndeProduz = evidences.some((e) => e.grupo === "onde_produz");
  const hasProduto = evidences.some((e) => e.grupo === "produto");

  if (!hasOndeProduz) {
    return {
      error: "Envie ao menos 1 foto de onde vocês produzem.",
      field: "onde_produz",
    };
  }
  if (!hasProduto) {
    return {
      error: "Envie ao menos 1 foto do produto ou da colheita.",
      field: "produto",
    };
  }

  const result = await saveDraftPart(business.id, 4, {
    evidenceCount: evidences.length,
  });
  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/produtor/cadastro/5");
}
