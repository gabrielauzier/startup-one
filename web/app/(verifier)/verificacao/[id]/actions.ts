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
 * RF-15/RN-14/RN-18: marca os itens com problema e o motivo (20+
 * caracteres); transiciona em_analise -> ajuste_solicitado. O produtor
 * reabre o cadastro e reenvia (RN-14) - o reenvio volta ao fim da fila
 * porque submitBusiness (T24) grava uma nova revisao "em_analise" a
 * cada envio.
 */
export async function requestAdjustment(
  businessId: string,
  motivo: string,
  checklist: ChecklistState,
  itensAjuste: string[]
): Promise<DecisionResult> {
  const auth = await requireVerifier();
  if (!auth.ok) return auth;

  if (!isValidMotivo(motivo)) {
    return { ok: false, error: "O motivo precisa ter ao menos 20 caracteres." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, status")
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
    .select("id, status")
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
    .select("id, status")
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

  const { error: updateError } = await admin
    .from("businesses")
    .update({
      status: "verificado",
      nota_a: input.notaA,
      nota_s: input.notaS,
      nota_g: input.notaG,
      verificado_em: now.toISOString(),
      selo_valido_ate: seloValidoAte(now).toISOString(),
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

  redirect("/verificacao");
}
