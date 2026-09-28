"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notifications/send-email";

export interface ConexaoActionResult {
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
    return { ok: false, error: "Só verificadores podem apresentar as partes." };
  }

  return { ok: true, userId: user.id };
}

/**
 * RF-30/RN-40/CA-40.1/CA-40.2: apresenta as partes de um interesse
 * Aceito ao parceiro financeiro do negócio (`businesses.indicado_por`
 * -> `partners.email_contato`) - envia o e-mail (via `sendEmail`,
 * SPEC_DEVIATION documentada lá: a fila real chega no T53) e grava o
 * evento `apresentada_ao_parceiro` em `connection_events`, avançando a
 * etapa consumida pela Timeline do investidor (T47).
 *
 * CA-40.1: só avança a partir de `aceita` - um interesse ainda
 * `pendente` (Timeline em `pendente`) ou já apresentado antes é
 * recusado aqui. RLS de `interests`/`connection_events` (T45) usa o
 * cliente de sessão para a leitura; a checagem de negócio sem parceiro
 * indicado usa o cliente admin (nenhuma RLS própria em `partners`).
 */
export async function presentToPartner(interestId: string): Promise<ConexaoActionResult> {
  const auth = await requireVerifier();
  if (!auth.ok) return auth;

  const supabase = await createServerClient();

  const { data: interest } = await supabase
    .from("interests")
    .select("id, business_id, status")
    .eq("id", interestId)
    .maybeSingle();

  if (!interest) {
    return { ok: false, error: "Interesse não encontrado." };
  }
  if (interest.status !== "aceito") {
    return { ok: false, error: "Só é possível apresentar um interesse Aceito." };
  }

  const { data: lastEvent } = await supabase
    .from("connection_events")
    .select("etapa")
    .eq("interest_id", interestId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lastEvent?.etapa !== "aceita") {
    return { ok: false, error: "Este interesse já foi apresentado ao parceiro." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, nome, indicado_por")
    .eq("id", interest.business_id)
    .maybeSingle();

  if (!business?.indicado_por) {
    return { ok: false, error: "Este negócio não tem um parceiro financeiro indicado." };
  }

  const { data: partner } = await admin
    .from("partners")
    .select("nome, email_contato")
    .eq("id", business.indicado_por)
    .maybeSingle();

  if (!partner?.email_contato) {
    return { ok: false, error: "O parceiro indicado não tem e-mail de contato cadastrado." };
  }

  await sendEmail({
    to: partner.email_contato,
    subject: `Îasy - apresentação de partes: ${business.nome}`,
    body: `O interesse ${interestId} no negócio ${business.nome} foi aceito e está pronto para conversa com o parceiro financeiro.`,
  });

  const { error } = await supabase.from("connection_events").insert({
    interest_id: interestId,
    etapa: "apresentada_ao_parceiro",
    autor_id: auth.userId,
    observacao: `E-mail enviado a ${partner.email_contato}`,
  });

  if (error) {
    return { ok: false, error: "Não foi possível registrar a apresentação." };
  }

  revalidatePath("/verificacao/conexoes");
  return { ok: true };
}

/**
 * RF-30: registra uma observação na linha do tempo sem mudar a etapa
 * atual - conveniência operacional do painel de conexões.
 */
export async function addObservation(
  interestId: string,
  etapaAtual: string,
  observacao: string
): Promise<ConexaoActionResult> {
  const auth = await requireVerifier();
  if (!auth.ok) return auth;

  if (observacao.trim().length === 0) {
    return { ok: false, error: "Escreva uma observação." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.from("connection_events").insert({
    interest_id: interestId,
    etapa: etapaAtual,
    autor_id: auth.userId,
    observacao: observacao.trim(),
  });

  if (error) {
    return { ok: false, error: "Não foi possível registrar a observação." };
  }

  revalidatePath("/verificacao/conexoes");
  return { ok: true };
}

/** Wrapper sem retorno, para uso direto como `action` de um `<form>`. */
export async function presentToPartnerForm(interestId: string): Promise<void> {
  await presentToPartner(interestId);
}
