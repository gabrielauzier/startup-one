"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { enqueueNotification } from "@/lib/notifications/queue";

export interface RespondDocumentRequestResult {
  ok: boolean;
  error?: string;
}

async function requireProducer(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
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
    return { ok: false, error: "Só a produtora pode decidir um pedido de documento." };
  }

  return { ok: true, userId: user.id };
}

/**
 * RF-23/RN-32/RN-33/CA-32.1/CA-32.3: libera ou recusa um pedido
 * `pendente`. RLS de `document_requests` (T39,
 * `document_requests_update_owner_business`) já garante que só a
 * produtora dona do negócio do documento pode fazer este UPDATE - usa
 * o cliente de sessão de propósito. Quando `decisao='liberar'`, o
 * trigger `set_document_request_expira_em` (T39) grava
 * `expira_em = decidido_em + 30 dias` automaticamente (RN-33).
 *
 * CA-32.3: recusar não expõe motivo nenhum ao investidor - a tela do
 * investidor (T41, SITUATION_LABELS) já mostra só "A produtora optou
 * por não liberar" para `status='recusado'`, sem campo de motivo aqui.
 *
 * Quando `decisao='liberar'`, enfileira o aviso `documento_liberado`
 * ao investidor via lib/notifications/queue.ts (T53) - e-mail
 * automático (RN-41, investidor sempre recebe e-mail a cada
 * novidade). Uma recusa não avisa ninguém (RF-31 só lista
 * `documento_liberado`, não uma versão "recusado" deste tipo).
 */
export async function respondDocumentRequest(
  requestId: string,
  decisao: "liberar" | "recusar"
): Promise<RespondDocumentRequestResult> {
  const auth = await requireProducer();
  if (!auth.ok) return auth;

  const supabase = await createServerClient();

  const { data: request } = await supabase
    .from("document_requests")
    .select("id, status, investor_id, document_id")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) {
    return { ok: false, error: "Pedido não encontrado." };
  }
  if (request.status !== "pendente") {
    return { ok: false, error: "Este pedido já foi decidido." };
  }

  const { error } = await supabase
    .from("document_requests")
    .update({
      status: decisao === "liberar" ? "liberado" : "recusado",
      decidido_em: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) {
    return { ok: false, error: "Não foi possível registrar a decisão." };
  }

  if (decisao === "liberar") {
    const admin = createAdminClient();
    const { data: document } = await admin
      .from("documents")
      .select("titulo")
      .eq("id", request.document_id)
      .maybeSingle();

    await enqueueNotification({
      type: "documento_liberado",
      payload: { requestId, documentId: request.document_id },
      destinatarioId: request.investor_id,
      email: {
        subject: "Îasy - documento liberado",
        body: `O documento "${document?.titulo ?? "solicitado"}" foi liberado para você.`,
      },
    });
  }

  revalidatePath("/produtor/pedidos");
  return { ok: true };
}

/**
 * RF-23/RN-33/CA-33.2: retira um acesso `liberado`, com efeito
 * imediato - a próxima abertura do documento (`viewDocument`, T42)
 * já vai negar o acesso, porque `computeDocumentSituation` só
 * considera `status='liberado'` como acesso válido.
 */
export async function revokeDocumentAccess(requestId: string): Promise<RespondDocumentRequestResult> {
  const auth = await requireProducer();
  if (!auth.ok) return auth;

  const supabase = await createServerClient();

  const { data: request } = await supabase
    .from("document_requests")
    .select("id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) {
    return { ok: false, error: "Pedido não encontrado." };
  }
  if (request.status !== "liberado") {
    return { ok: false, error: "Este acesso não está liberado." };
  }

  const { error } = await supabase
    .from("document_requests")
    .update({ status: "retirado" })
    .eq("id", requestId);

  if (error) {
    return { ok: false, error: "Não foi possível retirar o acesso." };
  }

  revalidatePath("/produtor/pedidos");
  return { ok: true };
}

/** Wrappers sem retorno, para uso direto como `action` de um `<form>`. */
export async function respondDocumentRequestForm(
  requestId: string,
  decisao: "liberar" | "recusar"
): Promise<void> {
  await respondDocumentRequest(requestId, decisao);
}

export async function revokeDocumentAccessForm(requestId: string): Promise<void> {
  await revokeDocumentAccess(requestId);
}
