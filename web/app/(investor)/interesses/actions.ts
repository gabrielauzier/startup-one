"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { INTEREST_MIN_VALOR } from "@/lib/business/interest-confirmation";

export interface InteresseActionResult {
  ok: boolean;
  error?: string;
}

/**
 * RN-36/RN-37/T51: edita o valor de um interesse próprio enquanto
 * Pendente, respeitando o limite do "Busca R$ X" do negócio (RN-36,
 * mesma regra de `createInterest`, T46). RLS `interests_update_own_pending`
 * (T45) já restringe a linhas Pendentes do próprio investidor - usa o
 * cliente de sessão de propósito.
 */
export async function editInterestValue(
  interestId: string,
  novoValor: number
): Promise<InteresseActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Entre novamente." };
  }

  if (!Number.isFinite(novoValor) || novoValor < INTEREST_MIN_VALOR) {
    return { ok: false, error: "Informe um valor de pelo menos R$ 1.000." };
  }

  const { data: interest } = await supabase
    .from("interests")
    .select("id, business_id, status")
    .eq("id", interestId)
    .maybeSingle();

  if (!interest || interest.status !== "pendente") {
    return { ok: false, error: "Este interesse não pode mais ser editado." };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("valor_busca")
    .eq("id", interest.business_id)
    .maybeSingle();

  if (business && novoValor > Number(business.valor_busca)) {
    return { ok: false, error: "O valor não pode passar do que o negócio busca" };
  }

  const { error } = await supabase
    .from("interests")
    .update({ valor: novoValor })
    .eq("id", interestId);

  if (error) {
    return { ok: false, error: "Não foi possível atualizar o valor." };
  }

  revalidatePath("/interesses");
  return { ok: true };
}

/**
 * RN-37/CA-29.2/T51: cancela um interesse próprio enquanto Pendente -
 * some da soma de RN-29 (`interest-sum.ts` já ignora status diferente
 * de pendente/aceito) e libera o índice único parcial de T45 para um
 * novo interesse no mesmo negócio.
 */
export async function cancelInterest(interestId: string): Promise<InteresseActionResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Entre novamente." };
  }

  const { data: interest } = await supabase
    .from("interests")
    .select("id, status")
    .eq("id", interestId)
    .maybeSingle();

  if (!interest || interest.status !== "pendente") {
    return { ok: false, error: "Este interesse não pode mais ser cancelado." };
  }

  const { error } = await supabase
    .from("interests")
    .update({ status: "cancelado" })
    .eq("id", interestId);

  if (error) {
    return { ok: false, error: "Não foi possível cancelar o interesse." };
  }

  revalidatePath("/interesses");
  return { ok: true };
}

/** Wrapper sem retorno, para uso direto como `action` de um `<form>`. */
export async function cancelInterestForm(interestId: string): Promise<void> {
  await cancelInterest(interestId);
}
