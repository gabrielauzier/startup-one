/**
 * RN-40/CA-40.2: envio de e-mail ao parceiro financeiro com os dados
 * das duas partes, ao apresentá-las.
 *
 * SPEC_DEVIATION (T49): a fila de notificação real (`lib/notifications/queue.ts`,
 * provedor de e-mail configurado, retries, etc.) só chega no T53 (Fase
 * 11, fora deste lote) - `presentToPartner` (`app/(verifier)/verificacao/conexoes/actions.ts`)
 * depende dela como "Reuse" no texto da task, mas não existe ainda.
 * Esta função é a interface estável que o T53 vai substituir por uma
 * implementação real (provedor de e-mail) sem mudar quem a chama -
 * hoje ela só grava a intenção de envio (log) e devolve sucesso
 * síncrono, para que a mudança de etapa em `connection_events`
 * continue confiável mesmo sem um provedor configurado neste ambiente
 * de dev. `presentToPartner` grava no `connection_events.observacao`
 * o destinatário e o assunto, então o rastro de "o que seria enviado"
 * fica visível no painel mesmo sem envio real.
 */
export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  ok: boolean;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  console.log(`[email] para ${input.to} - ${input.subject}\n${input.body}`);
  return { ok: true };
}
