"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canAssign } from "@/lib/verification/assignment";

export interface AssignToMeResult {
  ok: boolean;
  error?: string;
}

/**
 * RF-14/RN-17: ao abrir um item da fila, ele fica com o verificador por
 * 24h (CA-17.1). `businesses` ja tem policy de SELECT para o
 * verificador (T25), mas o UPDATE continua no cliente admin - nao ha
 * policy de escrita para verificador ainda (mesmo padrao usado desde o
 * T17 para o produtor).
 */
export async function assignToMe(businessId: string): Promise<AssignToMeResult> {
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
    return { ok: false, error: "Só verificadores podem assumir itens da fila." };
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, assigned_to, assigned_at")
    .eq("id", businessId)
    .maybeSingle();

  if (!business) {
    return { ok: false, error: "Negócio não encontrado." };
  }

  if (
    !canAssign(
      { assignedTo: business.assigned_to, assignedAt: business.assigned_at },
      user.id,
      new Date()
    )
  ) {
    return {
      ok: false,
      error: "Este item está com outro verificador (trava de 24h ainda ativa).",
    };
  }

  const { error } = await admin
    .from("businesses")
    .update({ assigned_to: user.id, assigned_at: new Date().toISOString() })
    .eq("id", businessId);

  if (error) {
    return { ok: false, error: "Não foi possível assumir o item. Tente de novo." };
  }

  revalidatePath("/verificacao");
  return { ok: true };
}
