"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveBusinessForOwner } from "@/lib/business/draft";
import { saveDraftPart } from "../actions";
import { VALOR_MAX, VALOR_MIN, VALOR_STEP } from "./constants";

const FINALIDADES = ["obras", "equipamentos", "area", "contas"] as const;
const PRAZOS = [12, 18, 24, 36] as const;

export interface Parte5State {
  error?: string;
  field?: string;
}

/**
 * RF-10/RN-10: valida e persiste a Parte 5 (Quanto vocês precisam).
 * Valor entre R$50 mil e R$200 mil em passos de R$5 mil (CA-10.1),
 * prazo em {12,18,24,36} e retorno entre 0% e 30% com 1 casa decimal.
 */
export async function submitParte5(
  _prevState: Parte5State,
  formData: FormData
): Promise<Parte5State> {
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

  const finalidade = String(formData.get("finalidade") ?? "");
  const valorBusca = Number(formData.get("valorBusca"));
  const prazoMeses = Number(formData.get("prazoMeses"));
  const retornoPropostoRaw = String(formData.get("retornoProposto") ?? "").trim();
  const retornoProposto = Number(retornoPropostoRaw.replace(",", "."));

  if (!FINALIDADES.includes(finalidade as (typeof FINALIDADES)[number])) {
    return { error: "Escolha a finalidade.", field: "finalidade" };
  }

  // CA-10.1: fora do intervalo mostra os limites.
  if (
    !Number.isFinite(valorBusca) ||
    valorBusca < VALOR_MIN ||
    valorBusca > VALOR_MAX ||
    valorBusca % VALOR_STEP !== 0
  ) {
    return {
      error: "O valor precisa estar entre R$ 50 mil e R$ 200 mil, em passos de R$ 5 mil.",
      field: "valorBusca",
    };
  }

  if (!PRAZOS.includes(prazoMeses as (typeof PRAZOS)[number])) {
    return { error: "Escolha o prazo para devolver.", field: "prazoMeses" };
  }

  if (
    retornoPropostoRaw === "" ||
    !Number.isFinite(retornoProposto) ||
    retornoProposto < 0 ||
    retornoProposto > 30
  ) {
    return {
      error: "O retorno ao ano precisa estar entre 0% e 30%.",
      field: "retornoProposto",
    };
  }

  const result = await saveDraftPart(business.id, 5, {
    finalidade,
    valorBusca,
    prazoMeses,
    // 1 casa decimal (CA-10.2): arredonda para nunca gravar mais que isso.
    retornoProposto: Math.round(retornoProposto * 10) / 10,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/produtor/cadastro/revisar");
}
