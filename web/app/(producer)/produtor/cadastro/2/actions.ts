"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveBusinessForOwner } from "@/lib/business/draft";
import { isInAmazoniaLegal } from "@/lib/validation/amazonia-legal";
import { saveDraftPart } from "../actions";

const TIPOS_ORG = ["cooperativa", "associacao", "pequena_empresa"] as const;

export interface Parte2State {
  error?: string;
  field?: string;
  outOfScope?: boolean;
}

/**
 * RF-07/RN-05: valida e persiste a Parte 2 (Seu negócio). Todos os
 * campos são obrigatórios (RN-06). Cidade fora da Amazônia Legal não
 * bloqueia salvar o contato já informado (CA-07.1-like: nunca perder o
 * que foi digitado), mas impede seguir para a parte 3 - explica o
 * escopo do piloto em vez disso (CA-05.2).
 */
export async function submitParte2(
  _prevState: Parte2State,
  formData: FormData
): Promise<Parte2State> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Entre novamente." };
  }

  const admin = createAdminClient();
  const business = await getActiveBusinessForOwner(admin, user.id);
  if (!business) {
    redirect("/produtor");
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const tipoOrg = String(formData.get("tipoOrg") ?? "");
  const cidade = String(formData.get("cidade") ?? "").trim();
  const uf = String(formData.get("uf") ?? "").trim().toUpperCase();
  const familias = Number(formData.get("familias"));
  const anosAtividade = Number(formData.get("anosAtividade"));
  const recebeVisitas = formData.get("recebeVisitas") === "on";

  if (!nome) return { error: "Informe o nome do negócio.", field: "nome" };
  if (!TIPOS_ORG.includes(tipoOrg as (typeof TIPOS_ORG)[number])) {
    return { error: "Escolha o tipo de organização.", field: "tipoOrg" };
  }
  if (!cidade) return { error: "Informe a cidade.", field: "cidade" };
  if (!uf) return { error: "Informe o estado.", field: "uf" };
  if (!Number.isFinite(familias) || familias < 0) {
    return { error: "Informe o número de famílias.", field: "familias" };
  }
  if (!Number.isFinite(anosAtividade) || anosAtividade < 0) {
    return { error: "Informe o tempo de atividade.", field: "anosAtividade" };
  }

  const result = await saveDraftPart(business.id, 2, {
    nome,
    tipoOrg,
    cidade,
    uf,
    familias,
    anosAtividade,
    recebeVisitas,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  // CA-05.2: fora da Amazônia Legal - o contato ja' esta salvo (Parte 1),
  // mas o piloto nao avanca o cadastro dessa cidade.
  if (!isInAmazoniaLegal(uf)) {
    return { outOfScope: true };
  }

  redirect("/produtor/cadastro/3");
}
