"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";
import { trackEvent } from "@/lib/analytics/track";
import { isComplete, type DiscoveryAnswers } from "./types";

const COOKIE_NAME = "iasy_descobrir_respostas";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

/**
 * RN-23: grava a linha de `investor_answers` do usuario logado (upsert
 * por `investor_id` - "salvar substitui as anteriores", CA-23.2). Usa
 * o cliente de sessao (nao o admin): a policy "own row" da migracao
 * 0006 ja' cobre esse caso, a mais simples possivel de RLS.
 */
async function persistToDb(
  userId: string,
  answers: DiscoveryAnswers & {
    prioridade: string;
    faixaValor: string;
    produtos: string[];
    prazoMaxMeses: number;
  }
): Promise<void> {
  const supabase = await createServerClient();
  await supabase.from("investor_answers").upsert(
    {
      investor_id: userId,
      prioridade: answers.prioridade,
      faixa_valor: answers.faixaValor,
      produtos: answers.produtos,
      prazo_max_meses: answers.prazoMaxMeses,
      impactos: answers.impactos ?? [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "investor_id" }
  );
}

/**
 * RF-17/RN-22/RN-23: salva o progresso das 5 perguntas. Sempre grava
 * um cookie httpOnly (visitante ou logado) para sobreviver a
 * navegacao entre `/descobrir/[n]` (Voltar preserva a resposta
 * anterior, CA-22.4); quando o usuario esta logado e as 4 respostas
 * obrigatorias ja' existem, tambem grava em `investor_answers` (a
 * pergunta 5, opcional, pode chegar depois ou nunca - RN-22).
 */
export async function saveAnswers(answers: DiscoveryAnswers): Promise<{ ok: boolean }> {
  const store = await cookies();
  store.set(COOKIE_NAME, JSON.stringify(answers), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && isComplete(answers)) {
    await persistToDb(user.id, answers);

    // RF-32/PRD 8.1: evento de produto - só quando as 5 perguntas
    // estão completas (não uma resposta parcial), mesmo gate de
    // `isComplete` usado para persistir.
    await trackEvent({
      type: "descoberta_concluida",
      payload: {},
      atorId: user.id,
    });
  }

  return { ok: true };
}

/**
 * Le' as respostas atuais: de `investor_answers` se logado (fonte da
 * verdade), do cookie se visitante. Usado para pre-preencher cada
 * pergunta (CA-22.4) e para reabrir a pergunta 1 em "Alterar
 * respostas" com as marcacoes atuais (CA-23.2).
 */
export async function loadAnswers(): Promise<DiscoveryAnswers> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data } = await supabase
      .from("investor_answers")
      .select("prioridade, faixa_valor, produtos, prazo_max_meses, impactos")
      .eq("investor_id", user.id)
      .maybeSingle();

    if (data) {
      return {
        prioridade: data.prioridade,
        faixaValor: data.faixa_valor,
        produtos: data.produtos,
        prazoMaxMeses: data.prazo_max_meses,
        impactos: data.impactos,
      };
    }
  }

  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return {};

  try {
    return JSON.parse(raw) as DiscoveryAnswers;
  } catch {
    return {};
  }
}

/**
 * RN-23/CA-23.1: "um visitante sem conta responde as 5 perguntas [...]
 * o sistema guarda as respostas no navegador e migra para o perfil ao
 * entrar". Chamada por `verifyOtp` (app/(marketing)/entrar/actions.ts)
 * logo apos autenticar, antes de qualquer redirect - so' grava se as
 * respostas do cookie ja' estao completas (as 4 obrigatorias); um
 * visitante que respondeu so' parte das perguntas antes de entrar
 * continua o fluxo normalmente a partir do cookie (loadAnswers ja'
 * cobre esse caso, sem exigir a migracao aqui).
 */
export async function migrateCookieAnswersToProfile(userId: string): Promise<void> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return;

  let answers: DiscoveryAnswers;
  try {
    answers = JSON.parse(raw) as DiscoveryAnswers;
  } catch {
    store.delete(COOKIE_NAME);
    return;
  }

  if (isComplete(answers)) {
    await persistToDb(userId, answers);
    store.delete(COOKIE_NAME);
  }
}
