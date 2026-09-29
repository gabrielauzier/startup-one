/**
 * T55/RNF-08: funções puras de decisão de expiração - "dado um corte
 * de tempo, quais ids expiram" - separadas de qualquer I/O (a Route
 * Handler `app/api/cron/daily/route.ts` só orquestra a leitura, chama
 * estas funções, e grava o resultado). Isoladas assim, cada uma é
 * testável sem precisar de um banco real.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DraftRow {
  id: string;
  /** `businesses.created_at`. */
  createdAt: string;
  /** Revisão mais recente em `business_revisions`, ou null se nunca houve nenhuma. */
  lastRevisionAt: string | null;
}

/**
 * RN-07/CA-07.3: rascunho (status='rascunho') sem atividade há 90 dias
 * - "atividade" é a revisão mais recente, ou a criação do negócio se
 * ele nunca teve nenhuma parte salva (mesma regra do antigo
 * `app/api/cron/expire-drafts/route.ts`, T17).
 */
export function selectExpiredDrafts(
  drafts: DraftRow[],
  now: Date = new Date(),
  cutoffDays = 90
): string[] {
  const cutoff = now.getTime() - cutoffDays * DAY_MS;
  return drafts
    .filter((d) => new Date(d.lastRevisionAt ?? d.createdAt).getTime() < cutoff)
    .map((d) => d.id);
}

/**
 * CA-07.3 (Fix 5, rodada 1 do Verifier): rascunhos que ainda NAO
 * expiraram (`selectExpiredDrafts` não os pega), mas cuja última
 * atividade já passou de `cutoffDays - warningDays` dias - a janela de
 * "faltam `warningDays` dias" antes de `expire-drafts` apagar de
 * verdade.
 */
export function selectDraftsNearingExpiry(
  drafts: DraftRow[],
  now: Date = new Date(),
  cutoffDays = 90,
  warningDays = 7
): string[] {
  const expiredCutoff = now.getTime() - cutoffDays * DAY_MS;
  const warningCutoff = now.getTime() - (cutoffDays - warningDays) * DAY_MS;
  return drafts
    .filter((d) => {
      const lastActivity = new Date(d.lastRevisionAt ?? d.createdAt).getTime();
      return lastActivity < warningCutoff && lastActivity >= expiredCutoff;
    })
    .map((d) => d.id);
}

export interface CreatedAtRow {
  id: string;
  createdAt: string;
}

/**
 * RN-32: pedido de documento `pendente` sem resposta da produtora em 7
 * dias - vira `expirado` (o investidor pode refazer o pedido).
 */
export function selectExpiredPendingDocumentRequests(
  rows: CreatedAtRow[],
  now: Date = new Date(),
  cutoffDays = 7
): string[] {
  const cutoff = now.getTime() - cutoffDays * DAY_MS;
  return rows.filter((r) => new Date(r.createdAt).getTime() < cutoff).map((r) => r.id);
}

export interface ReleasedAccessRow {
  id: string;
  createdAt: string;
  /** `document_requests.expira_em` (gravado pelo trigger ao liberar, RN-33) - null só em dados antigos/inconsistentes, cai para created_at + 30 dias. */
  expiraEm: string | null;
}

/**
 * RN-33/CA-33.1: acesso `liberado` há mais de 30 dias - vira
 * `expirado`. Mesmo corte que `lib/business/document-status.ts`'s
 * `computeDocumentSituation` já usa para inferir isso na leitura; este
 * cron faz a mutação física correspondente.
 */
export function selectExpiredReleasedAccess(
  rows: ReleasedAccessRow[],
  now: Date = new Date(),
  cutoffDays = 30
): string[] {
  return rows
    .filter((r) => {
      const referencia = r.expiraEm
        ? new Date(r.expiraEm)
        : new Date(new Date(r.createdAt).getTime() + cutoffDays * DAY_MS);
      return now >= referencia;
    })
    .map((r) => r.id);
}

/**
 * RN-39: interesse `pendente` sem resposta da produtora em 10 dias -
 * vira `expirado`. Primeira implementação real desta expiração (até o
 * T55, só existia como comentário "coberto pelo cron da T53" no
 * Status de T48/T51).
 */
export function selectExpiredPendingInterests(
  rows: CreatedAtRow[],
  now: Date = new Date(),
  cutoffDays = 10
): string[] {
  const cutoff = now.getTime() - cutoffDays * DAY_MS;
  return rows.filter((r) => new Date(r.createdAt).getTime() < cutoff).map((r) => r.id);
}

export interface SealRow {
  id: string;
  /** `businesses.selo_valido_ate`. */
  seloValidoAte: string | null;
}

/**
 * CA-19.2 (Fix 5, rodada 1 do Verifier): negocios `verificado` cujo
 * selo ainda NAO venceu, mas vence dentro de `warningDays` dias - a
 * janela de "faltam 30 dias" antes de `expire-seals` mover para
 * `expirado`.
 */
export function selectSealsNearingExpiry(
  rows: SealRow[],
  now: Date = new Date(),
  warningDays = 30
): string[] {
  const warningCutoff = now.getTime() + warningDays * DAY_MS;
  return rows
    .filter((r) => {
      if (!r.seloValidoAte) return false;
      const validoAte = new Date(r.seloValidoAte).getTime();
      return validoAte > now.getTime() && validoAte <= warningCutoff;
    })
    .map((r) => r.id);
}
