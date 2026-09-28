import { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

export interface BusinessRow {
  id: string;
  owner_id: string;
  status: string;
  indicado_por: string | null;
}

export type DraftPartData = Record<string, unknown>;

export interface DraftData {
  part1: DraftPartData;
  part2: DraftPartData;
  part3: DraftPartData;
  part4: DraftPartData;
  part5: DraftPartData;
}

function emptyDraft(): DraftData {
  return { part1: {}, part2: {}, part3: {}, part4: {}, part5: {} };
}

/**
 * RF-11/CA-06.2: encontra o negocio ativo (nao encerrado) do produtor
 * logado - no maximo um por RN-05. Usa o cliente admin porque
 * `businesses` ainda nao tem policy de RLS propria (chega no T25).
 */
export async function getActiveBusinessForOwner(
  admin: AdminClient,
  ownerId: string
): Promise<BusinessRow | null> {
  const { data } = await admin
    .from("businesses")
    .select("id, owner_id, status, indicado_por")
    .eq("owner_id", ownerId)
    .not("status", "in", "(reprovado,expirado)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as BusinessRow | null) ?? null;
}

/**
 * RF-11/CA-06.2: reconstroi o estado atual do rascunho combinando, por
 * parte, os dados da revisao mais recente de `business_revisions`
 * (saveDraftPart grava cada envio como uma nova linha - historico de
 * RN-15 - em vez de sobrescrever). Assim voltar para uma parte anterior
 * e retornar preserva o que foi digitado, sem precisar duplicar o dado
 * nas colunas de `businesses` antes do envio final (T24).
 */
export async function getDraftData(
  admin: AdminClient,
  businessId: string
): Promise<DraftData> {
  const draft = emptyDraft();

  const { data } = await admin
    .from("business_revisions")
    .select("dados, created_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true });

  for (const row of data ?? []) {
    const dados = row.dados as { part?: number } & DraftPartData;
    const part = dados.part;
    if (part && part >= 1 && part <= 5) {
      const rest = { ...dados };
      delete rest.part;
      const key = `part${part}` as keyof DraftData;
      draft[key] = { ...draft[key], ...rest };
    }
  }

  return draft;
}
