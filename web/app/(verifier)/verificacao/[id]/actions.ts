"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertTransition, InvalidBusinessTransitionError } from "@/lib/business/state-machine";
import {
  isChecklistComplete,
  isValidMotivo,
  type ChecklistState,
} from "@/lib/verification/checklist";
import { validateNotas, seloValidoAte } from "@/lib/verification/notas";
import { enqueueNotification } from "@/lib/notifications/queue";
import type { ItemAjuste } from "@/lib/business/adjustable-fields";

export interface DecisionResult {
  ok: boolean;
  error?: string;
}

async function requireVerifier(): Promise<
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

  if (profile?.role !== "verificador") {
    return { ok: false, error: "Só verificadores podem decidir uma análise." };
  }

  return { ok: true, userId: user.id };
}

/**
 * RF-15/RN-14/RN-18/CA-14.1: marca os itens com problema (campo +
 * comentario especifico de cada um) e o motivo geral (20+ caracteres);
 * transiciona em_analise -> ajuste_solicitado. O produtor reabre o
 * cadastro e ve so' os campos marcados como editaveis, cada um com seu
 * comentario (getFieldAjusteInfoForPart em lib/business/draft.ts), e
 * reenvia (RN-14) - o reenvio volta ao fim da fila porque
 * submitBusiness (T24) grava uma nova revisao "em_analise" a cada
 * envio.
 */
export async function requestAdjustment(
  businessId: string,
  motivo: string,
  checklist: ChecklistState,
  itensAjuste: ItemAjuste[]
): Promise<DecisionResult> {
  const auth = await requireVerifier();
  if (!auth.ok) return auth;

  if (!isValidMotivo(motivo)) {
    return { ok: false, error: "O motivo precisa ter ao menos 20 caracteres." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, status, owner_id, nome")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) return { ok: false, error: "Negócio não encontrado." };

  try {
    assertTransition(business.status, "ajuste_solicitado");
  } catch (err) {
    if (err instanceof InvalidBusinessTransitionError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  const { error: updateError } = await admin
    .from("businesses")
    .update({ status: "ajuste_solicitado", assigned_to: null, assigned_at: null })
    .eq("id", businessId);
  if (updateError) return { ok: false, error: "Não foi possível registrar a decisão." };

  await admin.from("verifications").insert({
    business_id: businessId,
    verifier_id: auth.userId,
    decisao: "ajuste",
    motivo,
    checklist,
    itens_ajuste: itensAjuste,
  });

  // RF-31/RN-41: avisa o produtor que um ajuste foi pedido (WhatsApp
  // manual da equipe + e-mail em paralelo).
  await enqueueNotification({
    type: "ajuste_pedido",
    payload: { businessId, motivo },
    destinatarioId: business.owner_id,
    email: {
      subject: "Îasy - ajuste pedido no seu cadastro",
      body: `Pedimos um ajuste no cadastro de ${business.nome ?? "seu negócio"}: ${motivo}`,
    },
  });

  redirect("/verificacao");
}

/**
 * RF-15/RN-18: reprova com motivo (20+ caracteres); transiciona
 * em_analise -> reprovado (estado final, RN-12).
 */
export async function reject(
  businessId: string,
  motivo: string,
  checklist: ChecklistState
): Promise<DecisionResult> {
  const auth = await requireVerifier();
  if (!auth.ok) return auth;

  if (!isValidMotivo(motivo)) {
    return { ok: false, error: "O motivo precisa ter ao menos 20 caracteres." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, status, owner_id, nome")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) return { ok: false, error: "Negócio não encontrado." };

  try {
    assertTransition(business.status, "reprovado");
  } catch (err) {
    if (err instanceof InvalidBusinessTransitionError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  const { error: updateError } = await admin
    .from("businesses")
    .update({ status: "reprovado", assigned_to: null, assigned_at: null })
    .eq("id", businessId);
  if (updateError) return { ok: false, error: "Não foi possível registrar a decisão." };

  await admin.from("verifications").insert({
    business_id: businessId,
    verifier_id: auth.userId,
    decisao: "reprovar",
    motivo,
    checklist,
    itens_ajuste: [],
  });

  // RF-31/RN-41: avisa o produtor da reprovação (WhatsApp manual da
  // equipe + e-mail em paralelo).
  await enqueueNotification({
    type: "reprovacao",
    payload: { businessId, motivo },
    destinatarioId: business.owner_id,
    email: {
      subject: "Îasy - cadastro não aprovado",
      body: `O cadastro de ${business.nome ?? "seu negócio"} não foi aprovado: ${motivo}`,
    },
  });

  redirect("/verificacao");
}

export interface ApproveInput {
  businessId: string;
  checklist: ChecklistState;
  notaA: number;
  notaS: number;
  notaG: number;
}

/**
 * RF-15/RN-18/RN-19: Aprovar exige todos os itens do checklist
 * conferidos (CA-18.1) e as 3 notas A/S/G inteiras 0-100 (CA-19.1,
 * reforça em TypeScript o CHECK já existente no banco desde o T13).
 * Concede o selo "Verificado Îasy" por 12 meses.
 */
export async function approve(input: ApproveInput): Promise<DecisionResult> {
  const auth = await requireVerifier();
  if (!auth.ok) return auth;

  if (!isChecklistComplete(input.checklist)) {
    return { ok: false, error: "Confira todos os itens do checklist antes de aprovar." };
  }

  const notasCheck = validateNotas(input.notaA, input.notaS, input.notaG);
  if (!notasCheck.ok) {
    return { ok: false, error: notasCheck.error };
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, status, owner_id, nome")
    .eq("id", input.businessId)
    .maybeSingle();

  if (!business) return { ok: false, error: "Negócio não encontrado." };

  try {
    assertTransition(business.status, "verificado");
  } catch (err) {
    if (err instanceof InvalidBusinessTransitionError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  const now = new Date();
  const seloAte = seloValidoAte(now);

  const { error: updateError } = await admin
    .from("businesses")
    .update({
      status: "verificado",
      nota_a: input.notaA,
      nota_s: input.notaS,
      nota_g: input.notaG,
      verificado_em: now.toISOString(),
      selo_valido_ate: seloAte.toISOString(),
      assigned_to: null,
      assigned_at: null,
    })
    .eq("id", input.businessId);
  if (updateError) return { ok: false, error: "Não foi possível registrar a decisão." };

  await admin.from("verifications").insert({
    business_id: input.businessId,
    verifier_id: auth.userId,
    decisao: "aprovar",
    motivo: null,
    checklist: input.checklist,
    itens_ajuste: [],
  });

  // RF-31/RN-41: avisa o produtor do selo concedido (WhatsApp manual
  // da equipe + e-mail em paralelo).
  await enqueueNotification({
    type: "selo_concedido",
    payload: { businessId: input.businessId, seloValidoAte: seloAte.toISOString() },
    destinatarioId: business.owner_id,
    email: {
      subject: "Îasy - selo Verificado Îasy concedido",
      body: `${business.nome ?? "Seu negócio"} recebeu o selo Verificado Îasy, válido até ${seloAte.toLocaleDateString("pt-BR")}.`,
    },
  });

  redirect("/verificacao");
}

/**
 * RF-16/RN-21: suspende um negocio Verificado com motivo obrigatorio
 * (mesma regra de 20+ caracteres de RN-18). Tira o negocio da vitrine
 * (RN-13 ja filtra so' `status='verificado'` como publico, entao
 * `suspenso` deixa de aparecer automaticamente - T25) e bloqueia novos
 * interesses/pedidos de documento (M6, ainda nao existe - ver
 * SPEC_DEVIATION no Status desta task em tasks.md).
 */
export async function suspend(businessId: string, motivo: string): Promise<DecisionResult> {
  const auth = await requireVerifier();
  if (!auth.ok) return auth;

  if (!isValidMotivo(motivo)) {
    return { ok: false, error: "O motivo precisa ter ao menos 20 caracteres." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, status, owner_id, nome")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) return { ok: false, error: "Negócio não encontrado." };

  try {
    assertTransition(business.status, "suspenso");
  } catch (err) {
    if (err instanceof InvalidBusinessTransitionError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  const { error: updateError } = await admin
    .from("businesses")
    .update({ status: "suspenso" })
    .eq("id", businessId);
  if (updateError) return { ok: false, error: "Não foi possível registrar a decisão." };

  await admin.from("verifications").insert({
    business_id: businessId,
    verifier_id: auth.userId,
    decisao: "suspender",
    motivo,
    checklist: {},
    itens_ajuste: [],
  });

  // CA-21.1/Fix 5 (rodada 1 do Verifier): avisa o produtor e todo
  // interessado em aberto (Pendente ou Aceito) que o negocio foi
  // suspenso. RF-31 nao tinha um tipo para isso (spec-precision gap
  // apontado pelo Verifier) - "suspensao_negocio" (produtor,
  // whatsapp+email) e "suspensao_negocio_investidor" (investidor, so'
  // email) sao os 2 tipos novos que cobrem os 2 destinatarios.
  await enqueueNotification({
    type: "suspensao_negocio",
    payload: { businessId, motivo },
    destinatarioId: business.owner_id,
    email: {
      subject: "Îasy - seu negócio foi suspenso",
      body: `${business.nome ?? "Seu negócio"} foi suspenso pela equipe de verificação: ${motivo}`,
    },
  });

  const { data: interessesAbertos } = await admin
    .from("interests")
    .select("investor_id")
    .eq("business_id", businessId)
    .in("status", ["pendente", "aceito"]);

  for (const interesse of interessesAbertos ?? []) {
    await enqueueNotification({
      type: "suspensao_negocio_investidor",
      payload: { businessId },
      destinatarioId: interesse.investor_id,
      email: {
        subject: "Îasy - negócio de interesse foi suspenso",
        body: `${business.nome ?? "O negócio"} em que você demonstrou interesse foi suspenso pela equipe de verificação e não está mais disponível na vitrine.`,
      },
    });
  }

  return { ok: true };
}

/** RF-16/RN-21: reativa um negocio suspenso, sem exigir motivo. */
export async function reactivate(businessId: string): Promise<DecisionResult> {
  const auth = await requireVerifier();
  if (!auth.ok) return auth;

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, status")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) return { ok: false, error: "Negócio não encontrado." };

  try {
    assertTransition(business.status, "verificado");
  } catch (err) {
    if (err instanceof InvalidBusinessTransitionError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  const { error: updateError } = await admin
    .from("businesses")
    .update({ status: "verificado" })
    .eq("id", businessId);
  if (updateError) return { ok: false, error: "Não foi possível registrar a decisão." };

  await admin.from("verifications").insert({
    business_id: businessId,
    verifier_id: auth.userId,
    decisao: "reativar",
    motivo: null,
    checklist: {},
    itens_ajuste: [],
  });

  return { ok: true };
}
