"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type EntrarRole = "investidor" | "empresa" | "produtor";

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

  redirect(`/entrar/codigo?email=${encodeURIComponent(email)}&role=${role}`);
}

export interface VerifyOtpState {
  error?: string;
  attempts: number;
}

/**
 * RN-02: confirma o codigo de 6 digitos. Depois de 5 tentativas
 * erradas, para de tentar e pede um novo codigo (CA-02.1). Na primeira
 * confirmacao de um e-mail sem conta, cria o profile com o papel
 * escolhido (CA-02.2) - usa o cliente admin porque ainda nao existe
 * policy de insert para o proprio usuario (essa vem no T12).
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

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .upsert(
      { id: data.user.id, role, nome: email.split("@")[0] },
      { onConflict: "id", ignoreDuplicates: true }
    );

  redirect("/");
}
