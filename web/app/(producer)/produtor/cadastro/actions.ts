"use server";

import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .select("id, owner_id")
    .eq("id", businessId)
    .maybeSingle();

  if (!business || business.owner_id !== user.id) {
    return { ok: false, error: "Cadastro não encontrado." };
  }

  const { error } = await admin.from("business_revisions").insert({
    business_id: businessId,
    dados: { part, ...data },
    status: "rascunho",
  });

  if (error) {
    return { ok: false, error: "Não foi possível salvar. Tente de novo." };
  }

  return { ok: true };
}
