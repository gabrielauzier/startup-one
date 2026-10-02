"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveBusinessForOwner } from "@/lib/business/draft";
import { trackEvent } from "@/lib/analytics/track";

export interface CreateBusinessState {
  error?: string;
}

/**
 * RF-05/RN-11: cria o negocio em `rascunho` ao tocar em "Começar
 * cadastro" nas boas-vindas (T18), guardando o parceiro indicador
 * quando houver (CA-11.1/CA-11.2). Usa o cliente admin porque
 * `businesses` ainda nao tem policy de RLS propria (chega no T25).
 */
export async function createBusiness(
  _prevState: CreateBusinessState,
  formData: FormData
): Promise<CreateBusinessState> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const indicado = String(formData.get("indicado") ?? "nao");
  const parceiroId = String(formData.get("parceiroId") ?? "").trim();

  if (indicado === "sim" && !parceiroId) {
    return { error: "Escolha qual cooperativa ou ONG indicou você." };
  }

  const admin = createAdminClient();

  const existing = await getActiveBusinessForOwner(admin, user.id);
  if (existing) {
    redirect("/produtor/cadastro/1");
  }

  const { data: business, error } = await admin
    .from("businesses")
    .insert({
      owner_id: user.id,
      status: "rascunho",
      indicado_por: indicado === "sim" ? parceiroId : null,
    })
    .select("id")
    .single();

  if (error || !business) {
    return { error: "Não foi possível iniciar o cadastro. Tente de novo." };
  }

  // RF-32/PRD 8.1: evento de produto - o rascunho nasce.
  await trackEvent({
    type: "cadastro_iniciado",
    payload: { businessId: business.id },
    atorId: user.id,
  });

  redirect("/produtor/cadastro/1");
}
