"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { migrateCookieAnswersToProfile } from "@/app/(investor)/descobrir/actions";
import {
  isSafeRedirect,
  resolvePostLoginRedirect,
  type EntrarRole,
  type ProfileRole,
} from "./redirect";

export type { EntrarRole };

const VALID_ROLES: EntrarRole[] = ["investidor", "empresa", "produtor"];
const MAX_OTP_ATTEMPTS = 5;

export interface SendOtpState {
  error?: string;
}

/**
 * RF-02 / RN-02: envia o codigo de acesso por e-mail (Supabase Auth OTP).
 * Em caso de sucesso, redireciona para a tela de digitar o codigo (T9).
 */
export async function sendOtp(
  _prevState: SendOtpState,
  formData: FormData
): Promise<SendOtpState> {
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "");

  if (!email) {
    return { error: "Informe um e-mail." };
  }
  if (!VALID_ROLES.includes(role as EntrarRole)) {
    return { error: "Escolha como você usa a Îasy." };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { data: { role }, shouldCreateUser: true },
  });

  if (error) {
    return {
      error: "Não foi possível enviar o código. Confira o e-mail e tente de novo.",
    };
  }

  const params = new URLSearchParams({ email, role });
  if (isSafeRedirect(redirectTo)) {
    params.set("redirect", redirectTo);
  }
  redirect(`/entrar/codigo?${params.toString()}`);
}

export interface VerifyOtpState {
  error?: string;
  attempts: number;
}

/**
 * RN-02: confirma o codigo de 6 digitos. Depois de 5 tentativas
 * erradas, para de tentar e pede um novo codigo (CA-02.1). Na primeira
 * confirmacao de um e-mail sem conta, cria o profile com o papel
 * escolhido (CA-02.2). O upsert usa o cliente com a sessao do proprio
 * usuario (nao o admin): a policy de insert do T12 (RN-01, CA-01.3) ja
 * permite e ainda bloqueia role='verificador' direto no banco.
 */
export async function verifyOtp(
  prevState: VerifyOtpState,
  formData: FormData
): Promise<VerifyOtpState> {
  if (prevState.attempts >= MAX_OTP_ATTEMPTS) {
    return {
      attempts: prevState.attempts,
      error: "Você tentou muitas vezes. Peça um novo código.",
    };
  }

  const email = String(formData.get("email") ?? "");
  const role = String(formData.get("role") ?? "");
  const code = String(formData.get("code") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "");

  if (!email || !VALID_ROLES.includes(role as EntrarRole)) {
    return {
      attempts: prevState.attempts,
      error: "Sessão inválida. Peça um novo código.",
    };
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error || !data.user) {
    return {
      attempts: prevState.attempts + 1,
      error: "Código inválido ou vencido.",
    };
  }

  await supabase
    .from("profiles")
    .upsert(
      { id: data.user.id, role, nome: email.split("@")[0] },
      { onConflict: "id", ignoreDuplicates: true }
    );

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, termos_aceitos_em")
    .eq("id", data.user.id)
    .single();

  const actualRole = (profile?.role as ProfileRole | undefined) ?? (role as ProfileRole);

  // RN-23/CA-23.1: migra as respostas da descoberta guardadas no
  // cookie de visitante para `investor_answers` assim que ele entra -
  // antes de qualquer redirect (termos ou destino final), para nunca
  // perder o cookie por causa de um `redirect()` anterior.
  if (actualRole === "investidor" || actualRole === "empresa") {
    await migrateCookieAnswersToProfile(data.user.id);
  }

  // RN-03/RF-04: investidor e empresa precisam aceitar os Termos de Uso e a
  // Politica de Privacidade no primeiro acesso, antes de qualquer outra
  // rota - inclusive antes de honrar um redirect de URL privada (CA-02.3).
  if (
    (actualRole === "investidor" || actualRole === "empresa") &&
    !profile?.termos_aceitos_em
  ) {
    const params = new URLSearchParams();
    if (isSafeRedirect(redirectTo)) params.set("redirect", redirectTo);
    redirect(`/termos?${params.toString()}`);
  }

  if (isSafeRedirect(redirectTo)) {
    redirect(redirectTo);
  }

  // resolvePostLoginRedirect ainda consulta businesses/investor_answers
  // via admin: essas tabelas (T13, T32) nao existem neste ponto do plano
  // e ainda nao tem RLS propria.
  const admin = createAdminClient();
  redirect(await resolvePostLoginRedirect(admin, data.user.id, actualRole));
}
