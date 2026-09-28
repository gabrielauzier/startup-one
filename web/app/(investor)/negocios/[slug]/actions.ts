"use server";

import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  INTEREST_CONFIRMATION_TEXT,
  INTEREST_MIN_VALOR,
  INTEREST_MAX_MENSAGEM_LENGTH,
} from "@/lib/business/interest-confirmation";

const VISITOR_COOKIE = "iasy_visitor";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * RN-35/CA-35.1: registra 1 visita ao perfil do negócio - deduplicada
 * por dia por pessoa (`profile_visits_unique_per_day`, T39). Visitante
 * logado usa `investor_id`; visitante anônimo usa um cookie httpOnly
 * (`iasy_visitor`) gerado na primeira visita e reaproveitado nas
 * seguintes, para não contar 2 visitas do mesmo anônimo no mesmo dia.
 *
 * Chamada por um Server Action (não pelo Server Component da página)
 * porque `cookies().set()` só é permitido em Server Actions/Route
 * Handlers - um Server Component não pode escrever cookies durante a
 * renderização (lib/supabase/server.ts documenta a mesma restrição).
 */
export async function recordProfileVisit(businessId: string): Promise<void> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let sessionId: string | null = null;
  if (!user) {
    const store = await cookies();
    sessionId = store.get(VISITOR_COOKIE)?.value ?? null;
    if (!sessionId) {
      sessionId = randomUUID();
      store.set(VISITOR_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: ONE_YEAR_SECONDS,
        path: "/",
      });
    }
  }

  const admin = createAdminClient();
  const { error } = await admin.from("profile_visits").insert({
    business_id: businessId,
    investor_id: user?.id ?? null,
    session_id: user ? null : sessionId,
  });

  // 23505 = violação do índice único de 1 visita/dia/pessoa - já
  // contada hoje, nada a fazer. Qualquer outro erro é ignorado de
  // propósito: registrar a visita nunca deve quebrar o carregamento
  // da página do negócio.
  if (error && error.code !== "23505") {
    console.error("Falha ao registrar visita ao perfil", error);
  }
}

export interface CreateInterestResult {
  ok: boolean;
  error?: string;
}

/**
 * RF-26/RN-36/RN-37/RN-38/CA-36.2/CA-37.1/CA-38.1/CA-38.2: cria o
 * interesse do investidor logado em um negócio Verificado. RLS de
 * `interests` (T45, `interests_insert_own`) já garante
 * `investor_id = auth.uid()` e papel investidor/empresa - usa o
 * cliente de sessão de propósito, mesmo padrão de
 * `requestDocumentAccess` (T41). O índice único parcial
 * (`interests_unique_pendente_aceito_per_investor_business`, T45)
 * garante RN-37 mesmo sob concorrência - o erro 23505 vira a mensagem
 * de "Ver meu interesse" (CA-37.1) tratada aqui como erro amigável.
 *
 * Grava também o evento inicial `pendente` em `connection_events`
 * (RN-40, linha do tempo consumida pelo T47/T49).
 *
 * TODO(T53): enfileirar o aviso à produtora via
 * lib/notifications/queue.ts (mesmo TODO já usado em
 * requestDocumentAccess, T41) - a fila só existe a partir do T53.
 */
export async function createInterest(
  slug: string,
  businessId: string,
  valor: number,
  mensagem: string,
  confirmado: boolean
): Promise<CreateInterestResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Sessão expirada. Entre novamente." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "investidor" && profile?.role !== "empresa") {
    return { ok: false, error: "Só investidores ou empresas podem demonstrar interesse." };
  }

  if (!confirmado) {
    return {
      ok: false,
      error: "Confirme que entende que ainda não é investimento.",
    };
  }

  const mensagemTrimmed = mensagem.trim();
  if (mensagemTrimmed.length > INTEREST_MAX_MENSAGEM_LENGTH) {
    return { ok: false, error: `A mensagem pode ter no máximo ${INTEREST_MAX_MENSAGEM_LENGTH} caracteres.` };
  }

  if (!Number.isFinite(valor) || valor < INTEREST_MIN_VALOR) {
    return { ok: false, error: "Informe um valor de pelo menos R$ 1.000." };
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, valor_busca, status")
    .eq("id", businessId)
    .maybeSingle();

  if (!business || business.status !== "verificado") {
    return { ok: false, error: "Negócio não encontrado." };
  }

  if (valor > Number(business.valor_busca)) {
    return { ok: false, error: "O valor não pode passar do que o negócio busca" };
  }

  const { data: interest, error } = await supabase
    .from("interests")
    .insert({
      business_id: businessId,
      investor_id: user.id,
      valor,
      mensagem: mensagemTrimmed.length > 0 ? mensagemTrimmed : null,
      confirmacao_texto: INTEREST_CONFIRMATION_TEXT,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        error: "Você já tem um interesse em andamento para este negócio.",
      };
    }
    return { ok: false, error: "Não foi possível enviar o interesse. Tente de novo." };
  }

  await supabase.from("connection_events").insert({
    interest_id: interest.id,
    etapa: "pendente",
    autor_id: user.id,
  });

  redirect(`/negocios/${slug}/interesse-enviado?id=${interest.id}`);
}
