"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export type EntrarRole = "investidor" | "empresa" | "produtor";

const VALID_ROLES: EntrarRole[] = ["investidor", "empresa", "produtor"];

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
