"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canRequestAccess, computeDocumentSituation } from "@/lib/business/document-status";
import { createDocumentSignedUrl } from "@/lib/documents/signed-url";
import { enqueueNotification } from "@/lib/notifications/queue";

export interface RequestDocumentAccessResult {
  ok: boolean;
  error?: string;
}

/**
 * RF-22/RN-32/CA-32.1: cria um `document_requests` pendente para o
 * investidor logado. RLS de `document_requests` (T39,
 * `document_requests_insert_own`) já garante `investor_id = auth.uid()`
 * - usa o cliente de sessão (não admin) de propósito, mesmo padrão de
 * `investor_answers` (saveAnswers, T32).
 *
 * RN-32: ao enviar o pedido, enfileira o aviso à produtora via
 * lib/notifications/queue.ts (T53) - WhatsApp manual da equipe +
 * e-mail em paralelo.
 */
export async function requestDocumentAccess(
  slug: string,
  documentId: string
): Promise<RequestDocumentAccessResult> {
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

  if (profile?.role !== "investidor" && profile?.role !== "empresa") {
    return { ok: false, error: "Só investidores ou empresas podem solicitar acesso a documentos." };
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id, titulo, aberto_a_todos, business_id")
    .eq("id", documentId)
    .maybeSingle();

  if (!document) {
    return { ok: false, error: "Documento não encontrado." };
  }
  if (document.aberto_a_todos) {
    return { ok: false, error: "Este documento já é aberto a todos." };
  }

  const { data: existing } = await supabase
    .from("document_requests")
    .select("status, created_at, expira_em")
    .eq("document_id", documentId)
    .eq("investor_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const situation = computeDocumentSituation(
    false,
    existing
      ? { status: existing.status, createdAt: existing.created_at, expiraEm: existing.expira_em }
      : null
  );

  if (!canRequestAccess(situation)) {
    return { ok: false, error: "Já existe um pedido em andamento ou uma decisão para este documento." };
  }

  const { error } = await supabase.from("document_requests").insert({
    document_id: documentId,
    investor_id: user.id,
  });

  if (error) {
    return { ok: false, error: "Não foi possível enviar o pedido. Tente de novo." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("owner_id, nome")
    .eq("id", document.business_id)
    .maybeSingle();

  if (business?.owner_id) {
    await enqueueNotification({
      type: "pedido_documento",
      payload: { documentId, businessId: document.business_id, titulo: document.titulo },
      destinatarioId: business.owner_id,
      email: {
        subject: "Îasy - novo pedido de documento",
        body: `Um investidor pediu acesso ao documento "${document.titulo}" de ${business.nome ?? "seu negócio"}.`,
      },
    });
  }

  revalidatePath(`/negocios/${slug}/documentos`);
  return { ok: true };
}

/**
 * Wrapper sem retorno para uso direto como `action` de um `<form>`
 * (RSC exige `(formData) => void | Promise<void>`) - o form da tabela
 * de documentos não tem UI de erro dedicada ainda (fora do escopo do
 * "Done when" do T41); qualquer falha só não altera a situação
 * exibida, sem quebrar a página.
 */
export async function requestDocumentAccessForm(slug: string, documentId: string): Promise<void> {
  await requestDocumentAccess(slug, documentId);
}

export interface ViewDocumentResult {
  /** false = investidor não tem acesso a este documento (nunca chegou a gravar view nem gerar URL). */
  authorized: boolean;
  nome?: string;
  signedUrl?: string;
  expiresIn?: number;
  authError?: string;
  storageError?: string;
}

/**
 * RF-24/RN-34/RN-35/AD-007: confere se o investidor logado tem acesso
 * ao documento (aberto a todos, ou pedido `liberado` ainda dentro dos
 * 30 dias - mesma `computeDocumentSituation` do T41), grava a
 * visualização em `document_views` (CA-35.1) e só então gera a URL
 * assinada de 5 minutos (CA-34.1/CA-34.2, `lib/documents/signed-url.ts`).
 *
 * A gravação de `document_views` acontece ANTES da tentativa de gerar
 * a URL assinada, de propósito: abrir a tela do documento já conta
 * como "aberto" (RN-35) mesmo se o Storage falhar depois - ver
 * SPEC_DEVIATION no Status do T42 em tasks.md sobre o Storage local
 * desabilitado neste ambiente.
 */
export async function viewDocument(documentId: string): Promise<ViewDocumentResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, authError: "Sessão expirada. Entre novamente." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, nome")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "investidor" && profile?.role !== "empresa") {
    return { authorized: false, authError: "Só investidores ou empresas podem ver documentos." };
  }

  const { data: document } = await supabase
    .from("documents")
    .select("id, storage_path, aberto_a_todos")
    .eq("id", documentId)
    .maybeSingle();

  if (!document) {
    return { authorized: false, authError: "Documento não encontrado." };
  }

  if (!document.aberto_a_todos) {
    const { data: existing } = await supabase
      .from("document_requests")
      .select("status, created_at, expira_em")
      .eq("document_id", documentId)
      .eq("investor_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const situation = computeDocumentSituation(
      false,
      existing
        ? { status: existing.status, createdAt: existing.created_at, expiraEm: existing.expira_em }
        : null
    );

    if (situation.kind !== "liberado") {
      return { authorized: false, authError: "Você não tem acesso a este documento." };
    }
  }

  await supabase.from("document_views").insert({
    document_id: documentId,
    investor_id: user.id,
  });

  const admin = createAdminClient();
  const signed = await createDocumentSignedUrl(admin.storage, document.storage_path);

  if (!signed.ok) {
    return {
      authorized: true,
      nome: profile.nome,
      storageError: "Não foi possível carregar o documento agora. Tente de novo em instantes.",
    };
  }

  return {
    authorized: true,
    nome: profile.nome,
    signedUrl: signed.signedUrl,
    expiresIn: signed.expiresIn,
  };
}
