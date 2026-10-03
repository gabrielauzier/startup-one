import { createAdminClient } from "@/lib/supabase/admin";

/**
 * RF-32/PRD 8.1: os 5 eventos de produto usados nas métricas do MVP.
 * Espelham 1:1 o `check` de `events.type` (0009_events.sql, mesma
 * tabela do T53 - discriminada por `kind`, ver comentário da
 * migração).
 */
export const AUTH_EVENT_TYPES = [
  "auth_cadastro_enviado",
  "auth_email_confirmado",
  "auth_login_senha_ok",
  "auth_login_senha_erro",
  "auth_magic_link_pedido",
  "auth_magic_link_ok",
  "auth_reset_pedido",
  "auth_reset_codigo_ok",
  "auth_reset_codigo_erro",
  "auth_senha_alterada",
  "auth_logout",
] as const;

export type AuthEventType = (typeof AUTH_EVENT_TYPES)[number];

export type ProductEventType =
  | "cadastro_iniciado"
  | "cadastro_enviado"
  | "descoberta_concluida"
  | "interesse_enviado"
  | "conexao_em_negociacao"
  | AuthEventType;

export interface TrackEventInput {
  type: ProductEventType;
  /** Dados livres do evento (ids envolvidos) - vira `events.payload`. */
  payload: Record<string, unknown>;
  /** `profiles.id` do ator, quando existir (nem todo evento de produto tem um - ex.: `cadastro_iniciado` é o próprio ato de criar o negócio, sempre logado, mas outros fluxos futuros podem não ter). */
  atorId?: string | null;
}

export interface TrackEventResult {
  ok: boolean;
  error?: string;
}

/**
 * RF-32: grava um evento de produto em `events` (kind='produto') -
 * sem canal nem envio, ao contrário de `enqueueNotification` (T53):
 * eventos de produto são só para as métricas da PRD 8.1, nunca viram
 * um aviso a alguém.
 */
export async function trackEvent(input: TrackEventInput): Promise<TrackEventResult> {
  const admin = createAdminClient();

  const { error } = await admin.from("events").insert({
    kind: "produto",
    type: input.type,
    payload: input.payload,
    destinatario_id: input.atorId ?? null,
    canal: null,
    enviado_em: null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
