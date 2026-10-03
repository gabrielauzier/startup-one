"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackEvent } from "@/lib/analytics/track";
import { sendEmail } from "@/lib/notifications/send-email";
import { setAuthContext } from "@/lib/auth/auth-context-cookie";
import { requestOrigin } from "@/lib/auth/origin";
import { normalizeEmail } from "@/lib/auth/email";
import { SEND_FAILED, throttleMessage } from "@/lib/auth/messages";
import { passwordRequirementMessage, validatePassword } from "@/lib/auth/password";
import { isValidRole, validateNome } from "@/lib/auth/role-options";
import { checkAndRecordSend } from "@/lib/auth/throttle";

export interface SignUpState {
  error?: string;
  roleError?: string;
  nomeError?: string;
  emailError?: string;
  passwordError?: string;
  confirmError?: string;
  /** Devolvidos para a tela nao apagar o que o visitante ja digitou (nunca a senha). */
  values?: { role: string; nome: string; email: string };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CREATE_FAILED = "Não foi possível criar a conta. Tente de novo.";
const TOO_MANY = "Muitos pedidos. Tente de novo em alguns minutos.";

async function track(role: string) {
  try {
    await trackEvent({ type: "auth_cadastro_enviado", payload: { papel: role } });
  } catch {
    // Telemetria nunca bloqueia o cadastro (AUTH-15.4).
  }
}

/**
 * AUTH-02 / AUTH-03: cadastro com perfil, nome, e-mail e senha.
 * Os tres caminhos (e-mail novo, ja confirmado, ja existente sem
 * confirmar) terminam na mesma tela (RN-54), sem criar usuario duplicado:
 *   none        -> signUp (o trigger cria o profile, AUTH-11)
 *   confirmed   -> nao chama signUp; avisa o titular por e-mail
 *   unconfirmed -> reenvia a confirmacao
 */
export async function signUpAction(
  _prev: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const role = String(formData.get("role") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const values = { role, nome, email };

  const passwordCheck = validatePassword(password);
  const errors: Partial<SignUpState> = {
    roleError: isValidRole(role) ? undefined : "Escolha como você usa a Îasy.",
    nomeError: validateNome(nome) ?? undefined,
    emailError: EMAIL_RE.test(email) ? undefined : "Informe um e-mail válido.",
    passwordError: passwordCheck.ok
      ? undefined
      : passwordRequirementMessage(passwordCheck.missing),
    confirmError: password === confirm ? undefined : "As senhas não são iguais.",
  };
  if (Object.values(errors).some(Boolean)) return { ...errors, values };

  const throttle = await checkAndRecordSend(email, "signup");
  if (!throttle.allowed) return { error: throttleMessage(throttle), values };

  const admin = createAdminClient();
  const { data: status } = await admin.rpc("email_account_status", { p_email: email });

  const supabase = await createServerClient();

  if (status === "confirmed") {
    await sendEmail({
      to: email,
      subject: "Alguém tentou criar uma conta na Îasy com este e-mail",
      body: `Você já tem uma conta na Îasy. Se foi você, entre em ${await requestOrigin()}/entrar ou use "Esqueci minha senha". Se não foi, ignore este e-mail.`,
    });
  } else if (status === "unconfirmed") {
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) return { error: SEND_FAILED, values };
  } else {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, nome, has_password: true } },
    });
    if (error && error.code !== "user_already_exists") {
      return { error: error.status === 429 ? TOO_MANY : CREATE_FAILED, values };
    }
  }

  await track(role);
  await setAuthContext({ email, kind: "signup" });
  redirect("/cadastro/confirmar-email");
}
