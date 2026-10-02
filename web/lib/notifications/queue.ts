import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notifications/send-email";

/**
 * RF-31: os 9 tipos de aviso da PRD, mais os 4 tipos de "prazo se
 * esgotando"/suspensão do Fix 5 (rodada 1 do Verifier) - RF-31 não
 * cobria "aviso de prazo se esgotando" nem "aviso de suspensão"
 * (spec-precision gap apontado pelo Verifier). `NotificationType`
 * espelha 1:1 o `check` de `events.type`
 * (0009_events.sql/0011_notification_types_avisos_prazo.sql).
 */
export type NotificationType =
  | "cadastro_recebido"
  | "ajuste_pedido"
  | "selo_concedido"
  | "reprovacao"
  | "pedido_documento"
  | "documento_liberado"
  | "interesse_recebido"
  | "interesse_aceito"
  | "apresentacao_parceiro"
  | "rascunho_expirando_em_breve"
  | "selo_expirando_em_breve"
  | "suspensao_negocio"
  | "suspensao_negocio_investidor";

/**
 * RN-41: "O produtor recebe WhatsApp para ajuste pedido, selo
 * concedido, pedido de documento e interesse recebido" - `cadastro_recebido`
 * e `reprovacao` também são avisos endereçados ao produtor (RF-31 lista
 * os 9 juntos, sem separar por canal para esses 2), então entram no
 * mesmo grupo de canal aqui.
 */
const PRODUCER_NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set([
  "cadastro_recebido",
  "ajuste_pedido",
  "selo_concedido",
  "reprovacao",
  "pedido_documento",
  "interesse_recebido",
  "rascunho_expirando_em_breve",
  "selo_expirando_em_breve",
  "suspensao_negocio",
]);

/** RN-41: "O investidor recebe e-mail a cada novidade". */
const INVESTOR_NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set([
  "documento_liberado",
  "interesse_aceito",
  "suspensao_negocio_investidor",
]);

export interface EmailContent {
  subject: string;
  body: string;
}

export interface EnqueueNotificationInput {
  type: NotificationType;
  /** Dados livres do evento (ids envolvidos, nomes, etc.) - vira `events.payload`. */
  payload: Record<string, unknown>;
  /**
   * `profiles.id` do destinatário do aviso (produtor dono do negócio,
   * ou investidor do interesse/pedido, conforme o tipo). Omitido/null
   * para `apresentacao_parceiro`, cujo destinatário (parceiro
   * financeiro) não é um profile - ver `emailTo`.
   */
  destinatarioId?: string | null;
  /** Assunto/corpo do e-mail, quando o tipo dispara e-mail (investidor sempre; produtor em paralelo à lista de WhatsApp; apresentacao_parceiro sempre). */
  email: EmailContent;
  /**
   * Endereço de e-mail explícito, para quando o destinatário não tem
   * `profiles.id` (ex.: `apresentacao_parceiro` → e-mail do parceiro
   * financeiro, resolvido em `partners.email_contato`). Quando
   * omitido, o e-mail do destinatário é lido de `auth.users` via
   * `destinatarioId`.
   */
  emailTo?: string;
}

export interface EnqueueNotificationResult {
  ok: boolean;
  error?: string;
}

interface EventRow {
  kind: "aviso";
  type: NotificationType;
  payload: Record<string, unknown>;
  destinatario_id: string | null;
  canal: "email" | "whatsapp_manual";
  enviado_em: string | null;
}

async function resolveEmailAddress(
  admin: ReturnType<typeof createAdminClient>,
  destinatarioId: string | null | undefined,
  emailTo: string | undefined
): Promise<string | null> {
  if (emailTo) return emailTo;
  if (!destinatarioId) return null;

  const { data, error } = await admin.auth.admin.getUserById(destinatarioId);
  if (error || !data?.user?.email) return null;
  return data.user.email;
}

async function sendAndBuildEmailRow(
  admin: ReturnType<typeof createAdminClient>,
  type: NotificationType,
  payload: Record<string, unknown>,
  destinatarioId: string | null,
  email: EmailContent,
  emailTo: string | undefined
): Promise<EventRow> {
  const to = await resolveEmailAddress(admin, destinatarioId, emailTo);
  const result = to ? await sendEmail({ to, subject: email.subject, body: email.body }) : { ok: false };

  return {
    kind: "aviso",
    type,
    payload,
    destinatario_id: destinatarioId,
    canal: "email",
    enviado_em: result.ok ? new Date().toISOString() : null,
  };
}

/**
 * RF-31/RF-32/RN-41: grava o aviso em `events` (0009_events.sql) e
 * dispara o canal certo conforme o destinatário:
 *
 * - Investidor (documento_liberado, interesse_aceito): e-mail
 *   automático a cada novidade ("Avisamos você a cada novidade") - 1
 *   linha, canal='email', via `sendEmail`.
 * - Produtor (cadastro_recebido, ajuste_pedido, selo_concedido,
 *   reprovacao, pedido_documento, interesse_recebido): no piloto, o
 *   aviso é WhatsApp manual da equipe a partir de modelos prontos -
 *   nenhuma automação de WhatsApp existe (decisão aceita em
 *   spec.md/PRD RN-41); esta função só GRAVA a linha
 *   canal='whatsapp_manual' (enviado_em sempre null), formando a
 *   lista diária que a equipe consulta (CA-41.1). Em paralelo, também
 *   grava e dispara o e-mail (RN-41: "o e-mail vai junto quando o
 *   produtor informou um" - neste MVP todo produtor tem e-mail via
 *   `auth.users`, então isso acontece sempre) - 2 linhas no total.
 * - `apresentacao_parceiro`: o destinatário é o parceiro financeiro
 *   (não um `profiles.id`) - 1 linha, canal='email', endereço vindo de
 *   `emailTo` (resolvido pelo chamador em `partners.email_contato`).
 */
export async function enqueueNotification(
  input: EnqueueNotificationInput
): Promise<EnqueueNotificationResult> {
  const admin = createAdminClient();
  const destinatarioId = input.destinatarioId ?? null;
  const rows: EventRow[] = [];

  if (INVESTOR_NOTIFICATION_TYPES.has(input.type)) {
    rows.push(
      await sendAndBuildEmailRow(admin, input.type, input.payload, destinatarioId, input.email, input.emailTo)
    );
  } else if (PRODUCER_NOTIFICATION_TYPES.has(input.type)) {
    rows.push({
      kind: "aviso",
      type: input.type,
      payload: input.payload,
      destinatario_id: destinatarioId,
      canal: "whatsapp_manual",
      enviado_em: null,
    });
    rows.push(
      await sendAndBuildEmailRow(admin, input.type, input.payload, destinatarioId, input.email, input.emailTo)
    );
  } else {
    // apresentacao_parceiro: destinatário externo, só e-mail.
    rows.push(
      await sendAndBuildEmailRow(admin, input.type, input.payload, null, input.email, input.emailTo)
    );
  }

  const { error } = await admin.from("events").insert(rows);
  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Gap 3 (Minor, rodada 2 do Verifier): os seletores de "faltam N dias"
 * (`selectDraftsNearingExpiry`/`selectSealsNearingExpiry`) devolvem toda
 * linha dentro da janela inteira (7 ou 30 dias) - com um cron diário,
 * isso mandaria o mesmo aviso todo dia enquanto o negócio estiver na
 * janela (até 7x/30x, quase sempre com a contagem de dias errada).
 *
 * Escolha de design (a mais simples que resolve, sem tabela/estado
 * novo): antes de enfileirar, confere se já existe um evento desse
 * `type` para esse `businessId` criado dentro dos últimos `windowDays`
 * dias - se sim, já foi avisado nesta janela, não repete. Como a janela
 * inteira (83-90 dias para rascunho, 0-30 para selo) tem exatamente
 * `windowDays` de largura, uma passada diária do cron nunca deixa passar
 * mais de 1 aviso por negócio por janela. Efeito colateral aceito: se o
 * cron ficar mais de `windowDays` dias sem rodar, o aviso pode ser
 * perdido silenciosamente - aceitável para um aviso informativo (o selo
 * ainda expira, ou o rascunho ainda é apagado, no dia certo,
 * independente do aviso).
 */
export async function wasNearingExpiryNotified(
  admin: ReturnType<typeof createAdminClient>,
  type: Extract<NotificationType, "rascunho_expirando_em_breve" | "selo_expirando_em_breve">,
  businessId: string,
  windowDays: number,
  now: Date = new Date()
): Promise<boolean> {
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await admin
    .from("events")
    .select("id")
    .eq("type", type)
    .eq("payload->>businessId", businessId)
    .gte("created_at", since)
    .limit(1)
    .maybeSingle();

  return !!data;
}
