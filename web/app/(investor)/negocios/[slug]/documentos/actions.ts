"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { canRequestAccess, computeDocumentSituation } from "@/lib/business/document-status";

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
 * TODO(T53): enfileirar o aviso à produtora via lib/notifications/queue.ts
 * (RN-32 "e SHALL notificar a produtora") - a fila só existe a partir
 * do T53 (mesmo padrão TODO já usado em app/api/cron/expire-seals).
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
    .select("id, aberto_a_todos")
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
