"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveBusinessForOwner } from "@/lib/business/draft";
import { saveDraftPart } from "../actions";

export interface Parte3State {
  error?: string;
  field?: string;
}

/**
 * RF-08/RN-06: valida e persiste a Parte 3 (Sua produção). Ao menos 1
 * produto e 1 prática, e producao mensal numerica e maior que zero
 * (CA-06.3).
 */
export async function submitParte3(
  _prevState: Parte3State,
  formData: FormData
): Promise<Parte3State> {
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

  const produtos = formData.getAll("produtos").map(String);
  const praticas = formData.getAll("praticas").map(String);
  const impactos = formData.getAll("impactos").map(String);
  const producaoMensalKgRaw = String(formData.get("producaoMensalKg") ?? "").trim();
  const producaoMensalKg = Number(producaoMensalKgRaw);

  if (produtos.length === 0) {
    return { error: "Escolha ao menos 1 produto.", field: "produtos" };
  }

  // CA-06.3: producao mensal zero, negativa ou nao numerica e rejeitada.
  if (
    producaoMensalKgRaw === "" ||
    !Number.isFinite(producaoMensalKg) ||
    producaoMensalKg <= 0
  ) {
    return {
      error: "Informe a produção mensal (maior que zero).",
      field: "producaoMensalKg",
    };
  }

  if (praticas.length === 0) {
    return { error: "Marque ao menos 1 prática.", field: "praticas" };
  }

  const result = await saveDraftPart(business.id, 3, {
    produtos,
    producaoMensalKg,
    praticas,
    impactos,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/produtor/cadastro/4");
}
