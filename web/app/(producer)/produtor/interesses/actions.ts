"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { enqueueNotification } from "@/lib/notifications/queue";

export interface DecideInterestResult {
  ok: boolean;
  error?: string;
}

async function requireProducer(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
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

  if (profile?.role !== "produtor") {
    return { ok: false, error: "Só a produtora pode decidir um interesse." };
  }

  return { ok: true, userId: user.id };
}

/**
 * RF-28/RN-39/CA-39.1/CA-39.2: aceita ou recusa um interesse Novo
 * (`pendente`). RLS de `interests` (T45,
 * `interests_update_owner_business_decision`) já garante que só a
 * produtora dona do negócio decide, e só a partir de `pendente` para
 * `aceito`/`recusado` - usa o cliente de sessão de propósito.
 *
 * Ao aceitar, grava o evento `aceita` em `connection_events` (RN-40 -
 * consumido pela Timeline do investidor, T47, e pelo painel de
 * conexões do verificador, T49). CA-39.2: recusar não grava motivo
 * nenhum nem expõe contato - a tela "Meus interesses" do investidor
 * (T51) mostra só "Não aceito pela produtora" para `status='recusado'`.
 *
 * Quando `decisao='aceitar'`, enfileira o aviso `interesse_aceito` ao
 * investidor via lib/notifications/queue.ts (T53) - e-mail automático
 * (RN-41, investidor sempre recebe e-mail a cada novidade). Recusar
 * não avisa ninguém (CA-39.2: sem exposição de motivo/contato).
 */
export async function decideInterest(
  interestId: string,
  decisao: "aceitar" | "recusar"
): Promise<DecideInterestResult> {
  const auth = await requireProducer();
  if (!auth.ok) return auth;

  const supabase = await createServerClient();

  const { data: interest } = await supabase
    .from("interests")
    .select("id, status, investor_id, business_id")
    .eq("id", interestId)
    .maybeSingle();

  if (!interest) {
    return { ok: false, error: "Interesse não encontrado." };
  }
  if (interest.status !== "pendente") {
    return { ok: false, error: "Este interesse já foi decidido." };
  }

  const novoStatus = decisao === "aceitar" ? "aceito" : "recusado";

  const { error } = await supabase
    .from("interests")
    .update({ status: novoStatus })
    .eq("id", interestId);

  if (error) {
    return { ok: false, error: "Não foi possível registrar a decisão." };
  }

  if (decisao === "aceitar") {
    await supabase.from("connection_events").insert({
      interest_id: interestId,
      etapa: "aceita",
      autor_id: auth.userId,
    });

    await enqueueNotification({
      type: "interesse_aceito",
      payload: { interestId, businessId: interest.business_id },
      destinatarioId: interest.investor_id,
      email: {
        subject: "Îasy - seu interesse foi aceito",
        body: "A produtora aceitou o seu interesse. Em breve apresentaremos as partes ao parceiro financeiro.",
      },
    });
  }

  revalidatePath("/produtor/interesses");
  return { ok: true };
}

/** Wrapper sem retorno, para uso direto como `action` de um `<form>`. */
export async function decideInterestForm(
  interestId: string,
  decisao: "aceitar" | "recusar"
): Promise<void> {
  await decideInterest(interestId, decisao);
}
