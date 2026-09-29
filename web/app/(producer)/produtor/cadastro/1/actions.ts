"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveBusinessForOwner } from "@/lib/business/draft";
import { isValidCnpj } from "@/lib/validation/cnpj";
import { mapCnpjUniqueViolation } from "@/lib/business/cnpj-uniqueness";
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

  // CA-05.3: reserva o CNPJ ja' na Parte 1 (nao so' no envio final),
  // para que dois rascunhos nao possam coexistir com o mesmo CNPJ ate'
  // um deles tentar enviar. O indice unico parcial
  // (businesses_cnpj_ativo_idx) e' quem garante isso a nivel de banco;
  // aqui so' traduzimos a violacao (23505) numa mensagem clara.
  const { error: cnpjError } = await admin
    .from("businesses")
    .update({ cnpj })
    .eq("id", business.id);

  if (cnpjError) {
    const duplicado = mapCnpjUniqueViolation(cnpjError);
    return {
      error: duplicado ?? "Não foi possível salvar. Tente de novo.",
      field: duplicado ? "cnpj" : undefined,
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
