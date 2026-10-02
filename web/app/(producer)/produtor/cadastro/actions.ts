"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDraftData, getLatestItensAjuste, type DraftData } from "@/lib/business/draft";
import { getFieldAjusteInfoForPart } from "@/lib/business/adjustable-fields";
import { validateRequiredFields } from "@/lib/business/required-fields";
import { buildBusinessSlug } from "@/lib/business/slug";
import { assertTransition, InvalidBusinessTransitionError } from "@/lib/business/state-machine";
import { mapCnpjUniqueViolation } from "@/lib/business/cnpj-uniqueness";
import { enqueueNotification } from "@/lib/notifications/queue";
import { trackEvent } from "@/lib/analytics/track";

export interface SaveDraftPartResult {
  ok: boolean;
  error?: string;
}

/**
 * RF-11/RN-07: persiste uma parte do cadastro do produtor como uma nova
 * revisao em rascunho (nunca sobrescreve as anteriores - RN-15 trata
 * revisoes como historico). Usa o cliente admin porque businesses e
 * business_revisions ainda nao tem policy de RLS para o dono; essa
 * policy chega no T25, junto com a visibilidade de negocios verificados.
 */
export async function saveDraftPart(
  businessId: string,
  part: 1 | 2 | 3 | 4 | 5,
  data: Record<string, unknown>
): Promise<SaveDraftPartResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Entre novamente." };
  }

  const admin = createAdminClient();

  const { data: business } = await admin
    .from("businesses")
    .select("id, owner_id, status")
    .eq("id", businessId)
    .maybeSingle();

  if (!business || business.owner_id !== user.id) {
    return { ok: false, error: "Cadastro não encontrado." };
  }

  // CA-14.1: em ajuste_solicitado, so' os campos marcados pelo
  // verificador (itens_ajuste) podem mudar. Nao confia no client (nem
  // no fato de que os campos travados vem `disabled`/`readOnly` no
  // form) - mescla aqui, no servidor, ignorando qualquer valor postado
  // para um campo nao marcado e mantendo o que ja' estava gravado no
  // rascunho. Parte 4 (fotos/evidencias) nao tem campos catalogados em
  // ADJUSTABLE_FIELDS e fica fora deste fluxo.
  let dataToSave = data;
  if (business.status === "ajuste_solicitado" && part !== 4) {
    const itens = await getLatestItensAjuste(admin, businessId);
    const ajuste = getFieldAjusteInfoForPart(itens, part);
    const draft = await getDraftData(admin, businessId);
    const existingPart = draft[`part${part}` as keyof DraftData];

    const merged: Record<string, unknown> = { ...existingPart };
    for (const key of Object.keys(data)) {
      if (ajuste.camposEditaveis.has(key)) {
        merged[key] = data[key];
      }
    }
    dataToSave = merged;
  }

  const { error } = await admin.from("business_revisions").insert({
    business_id: businessId,
    dados: { part, ...dataToSave },
    status: "rascunho",
  });

  if (error) {
    return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  }

  return { ok: true };
}

export interface SubmitBusinessState {
  error?: string;
  missing?: string[];
}

/**
 * RF-12/RF-13/RN-14: agrega o rascunho (historico de business_revisions,
 * ultima revisao por parte - ver lib/business/draft.ts) nas colunas de
 * `businesses` e transiciona rascunho -> em_analise via assertTransition
 * (RN-12). Falha sem gravar nada se algum obrigatorio estiver vazio
 * (RN-06). Tambem aceita reenvio a partir de `ajuste_solicitado`
 * (RN-14): o produtor reabre o cadastro, corrige o que foi pedido, e
 * este mesmo Server Action reenvia para analise.
 */
export async function submitBusiness(
  businessId: string,
  _prevState: SubmitBusinessState,
  _formData: FormData
): Promise<SubmitBusinessState> {
  void _prevState;
  void _formData;

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const admin = createAdminClient();

  const { data: business } = await admin
    .from("businesses")
    .select("id, owner_id, status")
    .eq("id", businessId)
    .maybeSingle();

  if (!business || business.owner_id !== user.id) {
    return { error: "Cadastro não encontrado." };
  }

  const draft = await getDraftData(admin, businessId);

  const { data: evidenceRows } = await admin
    .from("evidences")
    .select("grupo")
    .eq("business_id", businessId);

  const evidenceCounts = {
    onde_produz: (evidenceRows ?? []).filter((e) => e.grupo === "onde_produz").length,
    produto: (evidenceRows ?? []).filter((e) => e.grupo === "produto").length,
  };

  const validation = validateRequiredFields(draft, evidenceCounts);
  if (!validation.ok) {
    return {
      error: "Complete os campos obrigatórios antes de enviar.",
      missing: validation.missing,
    };
  }

  try {
    assertTransition(business.status, "em_analise");
  } catch (err) {
    if (err instanceof InvalidBusinessTransitionError) {
      return { error: err.message };
    }
    throw err;
  }

  const nomeNegocio = String(draft.part2.nome ?? "");
  const slug = buildBusinessSlug(nomeNegocio, businessId);

  const { error } = await admin
    .from("businesses")
    .update({
      cnpj: draft.part1.cnpj,
      nome: nomeNegocio,
      slug,
      tipo_org: draft.part2.tipoOrg,
      cidade_ibge: draft.part2.cidade,
      uf: draft.part2.uf,
      familias: draft.part2.familias,
      anos_atividade: draft.part2.anosAtividade,
      recebe_visitas: draft.part2.recebeVisitas ?? false,
      produtos: draft.part3.produtos,
      producao_mensal_kg: draft.part3.producaoMensalKg,
      praticas: draft.part3.praticas,
      impactos: draft.part3.impactos ?? [],
      finalidade: draft.part5.finalidade,
      valor_busca: draft.part5.valorBusca,
      prazo_meses: draft.part5.prazoMeses,
      retorno_proposto: draft.part5.retornoProposto,
      status: "em_analise",
    })
    .eq("id", businessId);

  if (error) {
    const duplicado = mapCnpjUniqueViolation(error);
    return { error: duplicado ?? "Não foi possível enviar o cadastro. Tente de novo." };
  }

  await admin.from("business_revisions").insert({
    business_id: businessId,
    dados: { part: "submit", submittedAt: new Date().toISOString() },
    status: "em_analise",
  });

  // RF-31/RN-41: avisa o produtor que o cadastro foi recebido e entrou
  // em análise (WhatsApp manual da equipe + e-mail em paralelo).
  await enqueueNotification({
    type: "cadastro_recebido",
    payload: { businessId, nome: nomeNegocio },
    destinatarioId: business.owner_id,
    email: {
      subject: "Îasy - cadastro recebido",
      body: `Recebemos o cadastro de ${nomeNegocio} e ele já está em análise pela nossa equipe.`,
    },
  });

  // RF-32/PRD 8.1: evento de produto - mesmo ponto do aviso acima, mas
  // registro separado (métrica, não aviso a alguém).
  await trackEvent({
    type: "cadastro_enviado",
    payload: { businessId },
    atorId: user.id,
  });

  redirect("/produtor/cadastro/enviado");
}
