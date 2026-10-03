"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { postAuthDestination } from "@/lib/auth/post-auth-server";
import { isValidRole, validateNome } from "@/lib/auth/role-options";

export interface CompleteProfileState {
  error?: string;
  nomeError?: string;
  roleError?: string;
}

/**
 * AUTH-11: usuario autenticado sem linha em `profiles` escolhe o perfil e
 * o nome. Insere com o cliente do proprio usuario: a policy
 * `profiles_insert_own` ja bloqueia `role = 'verificador'` (RN-01).
 */
export async function completeProfile(
  _prev: CompleteProfileState,
  formData: FormData
): Promise<CompleteProfileState> {
  const role = String(formData.get("role") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const redirectTo = String(formData.get("redirect") ?? "");

  const roleError = isValidRole(role) ? undefined : "Escolha como você usa a Îasy.";
  const nomeError = validateNome(nome) ?? undefined;
  if (roleError || nomeError) return { roleError, nomeError };

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { error } = await supabase.from("profiles").insert({ id: user.id, role, nome });
  if (error) {
    return { error: "Não foi possível salvar seu perfil. Tente de novo." };
  }

  redirect(await postAuthDestination(user.id, redirectTo));
}
