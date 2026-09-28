"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveBusinessForOwner } from "@/lib/business/draft";
import { isValidCnpj } from "@/lib/validation/cnpj";
import { saveDraftPart } from "../actions";

export interface Parte1State {
  error?: string;
  field?: string;
}

/**
 * RF-06/RN-03/RN-05: valida e persiste a Parte 1 (Sobre você). CNPJ com
 * digito invalido bloqueia o avanco (CA-05.1); sem a autorizacao
 * marcada, "Continuar" nao avanca (CA-03.1); campo obrigatorio vazio
 * recebe foco com mensagem de erro (CA-06.1).
 */
export async function submitParte1(
  _prevState: Parte1State,
  formData: FormData
): Promise<Parte1State> {
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
  const telefone = String(formData.get("telefone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const autorizacao = formData.get("autorizacao") === "on";

  if (!nome) {
    return { error: "Informe seu nome.", field: "nome" };
  }
  if (!telefone) {
    return { error: "Informe seu telefone com WhatsApp.", field: "telefone" };
  }
  if (!isValidCnpj(cnpj)) {
    return { error: "CNPJ inválido", field: "cnpj" };
  }
  if (!autorizacao) {
    return {
      error:
        "Marque a autorização de uso dos dados para continuar.",
      field: "autorizacao",
    };
  }

  const result = await saveDraftPart(business.id, 1, {
    nome,
    telefone,
    email,
    cnpj,
    autorizacao,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/produtor/cadastro/2");
}
