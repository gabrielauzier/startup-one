import type { Page } from "@playwright/test";
import { getUserIdByEmail, promoteToVerifier } from "./db";
import { waitForMail } from "./mailpit";
import { createConfirmedUser, TEST_PASSWORD } from "./session";

/** Entra pela tela `/entrar` com e-mail e senha (o fluxo real de AUTH-05). */
export async function signInThroughForm(
  page: Page,
  email: string,
  password: string = TEST_PASSWORD
): Promise<void> {
  // Quem ja esta logado nao ve o formulario (AUTH-01.9): encerra a sessao
  // anterior do teste (trocar de perfil na mesma page) sem apagar os demais
  // cookies (ex.: respostas da descoberta do visitante).
  await page.context().clearCookies({ name: /^sb-/ });
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

/**
 * Cria um produtor confirmado (admin API) e entra pela tela de senha.
 * Devolve o e-mail usado, para os testes poderem consultar o banco pelo
 * dono.
 */
export async function loginAsProducer(page: Page, emailPrefix: string): Promise<string> {
  const email = `${emailPrefix}-${Date.now()}@example.com`;
  await createConfirmedUser(email, { role: "produtor", nome: "Produtor de Teste" });

  await signInThroughForm(page, email);
  await page.waitForURL("**/produtor");

  return email;
}

/**
 * RF-02 a RF-04: cria um investidor confirmado e entra pela tela de
 * senha; aceita os Termos de Uso/Política de Privacidade (RN-03) - todo
 * investidor passa por esse gate no primeiro acesso antes de qualquer
 * outra rota, inclusive `/descobrir/*`. Devolve o e-mail usado.
 */
export async function loginAsInvestor(page: Page, emailPrefix: string): Promise<string> {
  const email = `${emailPrefix}-${Date.now()}@example.com`;
  await createConfirmedUser(email, { role: "investidor", nome: "Investidor de Teste" });

  await signInThroughForm(page, email);
  await page.waitForURL(/\/termos/);
  await page.getByRole("button", { name: "Aceitar e continuar" }).click();

  return email;
}

/**
 * RN-01: nao existe cadastro de `verificador` - so' a equipe credencia.
 * Cria um usuario confirmado, promove via REST/service-role
 * (helpers/db.ts `promoteToVerifier`), simulando esse credenciamento, e
 * entra pela tela de senha: o destino padrao do papel e' a fila.
 */
export async function loginAsVerifier(page: Page, emailPrefix: string): Promise<string> {
  const email = `${emailPrefix}-${Date.now()}@example.com`;
  const userId = await createConfirmedUser(email, { role: "investidor", nome: "Verificador de Teste" });
  await promoteToVerifier(userId);

  await signInThroughForm(page, email);
  await page.waitForURL("**/verificacao");

  return email;
}

/**
 * Fluxo real de esqueci-senha ate a sessao de recuperacao: pede o codigo,
 * le os 6 digitos no Mailpit, confirma e espera `/redefinir-senha`.
 */
export async function reachRecoverySession(page: Page, email: string): Promise<void> {
  const before = Date.now();
  await page.goto("/esqueci-senha");
  await page.getByLabel("E-mail").fill(email);
  await page.getByRole("button", { name: "Enviar código" }).click();
  await page.waitForURL("**/esqueci-senha/codigo");

  const mail = await waitForMail(email, { after: before, subject: "redefinir a senha" });
  await page.getByLabel("Código de 6 dígitos").fill(mail.Text.match(/\b\d{6}\b/)![0]);
  await page.getByRole("button", { name: "Confirmar" }).click();
  await page.waitForURL("**/redefinir-senha");
}

export { getUserIdByEmail };
