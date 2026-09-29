import { describe, it, expect } from "vitest";
import {
  selectExpiredDrafts,
  selectExpiredPendingDocumentRequests,
  selectExpiredReleasedAccess,
  selectExpiredPendingInterests,
  selectDraftsNearingExpiry,
  selectSealsNearingExpiry,
} from "../expiration";

const NOW = new Date("2026-09-28T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY_MS).toISOString();

describe("selectExpiredDrafts (RN-07/CA-07.3, T55)", () => {
  it("expira rascunho sem nenhuma revisao ha mais de 90 dias (usa created_at)", () => {
    const ids = selectExpiredDrafts(
      [{ id: "a", createdAt: daysAgo(91), lastRevisionAt: null }],
      NOW
    );
    expect(ids).toEqual(["a"]);
  });

  it("nao expira rascunho com revisao recente, mesmo criado ha muito tempo", () => {
    const ids = selectExpiredDrafts(
      [{ id: "a", createdAt: daysAgo(200), lastRevisionAt: daysAgo(1) }],
      NOW
    );
    expect(ids).toEqual([]);
  });

  it("nao expira rascunho criado ha 89 dias - fronteira exata (N-1) do corte de 90, kills M10 (cutoff mutado p/ 60)", () => {
    const ids = selectExpiredDrafts(
      [{ id: "a", createdAt: daysAgo(89), lastRevisionAt: null }],
      NOW
    );
    expect(ids).toEqual([]);
  });
});

describe("selectExpiredPendingDocumentRequests (RN-32, T55)", () => {
  it("expira pedido pendente sem resposta ha 8 dias - fronteira exata (N+1) do corte de 7, kills M6 (cutoff mutado p/ 4)", () => {
    const ids = selectExpiredPendingDocumentRequests([{ id: "r1", createdAt: daysAgo(8) }], NOW);
    expect(ids).toEqual(["r1"]);
  });

  it("nao expira pedido pendente com 6 dias - fronteira exata (N-1) do corte de 7, kills M6 (cutoff mutado p/ 4)", () => {
    const ids = selectExpiredPendingDocumentRequests([{ id: "r1", createdAt: daysAgo(6) }], NOW);
    expect(ids).toEqual([]);
  });
});

describe("selectExpiredReleasedAccess (RN-33/CA-33.1, T55)", () => {
  it("expira acesso liberado cujo expira_em ja passou", () => {
    const ids = selectExpiredReleasedAccess(
      [{ id: "d1", createdAt: daysAgo(40), expiraEm: daysAgo(1) }],
      NOW
    );
    expect(ids).toEqual(["d1"]);
  });

  it("nao expira acesso liberado cujo expira_em ainda nao chegou", () => {
    const ids = selectExpiredReleasedAccess(
      [{ id: "d1", createdAt: daysAgo(5), expiraEm: new Date(NOW.getTime() + DAY_MS).toISOString() }],
      NOW
    );
    expect(ids).toEqual([]);
  });

  it("sem expira_em gravado, cai para created_at + 30 dias", () => {
    const ids = selectExpiredReleasedAccess(
      [{ id: "d1", createdAt: daysAgo(31), expiraEm: null }],
      NOW
    );
    expect(ids).toEqual(["d1"]);
  });
});

describe("selectExpiredPendingInterests (RN-39, T55 - primeira implementação real desta expiração)", () => {
  it("expira interesse pendente sem resposta ha 11 dias - fronteira exata (N+1) do corte de 10, kills M5 (cutoff mutado p/ 5)", () => {
    const ids = selectExpiredPendingInterests([{ id: "i1", createdAt: daysAgo(11) }], NOW);
    expect(ids).toEqual(["i1"]);
  });

  it("nao expira interesse pendente com 9 dias - fronteira exata (N-1) do corte de 10, kills M5 (cutoff mutado p/ 5)", () => {
    const ids = selectExpiredPendingInterests([{ id: "i1", createdAt: daysAgo(9) }], NOW);
    expect(ids).toEqual([]);
  });
});

describe("selectDraftsNearingExpiry (CA-07.3, Fix 5 - rodada 1 do Verifier)", () => {
  it("avisa um rascunho com 84 dias sem atividade (dentro da janela de 7 dias antes dos 90)", () => {
    const ids = selectDraftsNearingExpiry(
      [{ id: "a", createdAt: daysAgo(84), lastRevisionAt: null }],
      NOW
    );
    expect(ids).toEqual(["a"]);
  });

  it("nao avisa um rascunho com 82 dias sem atividade (ainda fora da janela)", () => {
    const ids = selectDraftsNearingExpiry(
      [{ id: "a", createdAt: daysAgo(82), lastRevisionAt: null }],
      NOW
    );
    expect(ids).toEqual([]);
  });

  it("nao avisa de novo um rascunho ja' expirado (91 dias) - so' apaga", () => {
    const ids = selectDraftsNearingExpiry(
      [{ id: "a", createdAt: daysAgo(91), lastRevisionAt: null }],
      NOW
    );
    expect(ids).toEqual([]);
  });
});

describe("selectSealsNearingExpiry (CA-19.2, Fix 5 - rodada 1 do Verifier)", () => {
  const inDays = (n: number) => new Date(NOW.getTime() + n * DAY_MS).toISOString();

  it("avisa um selo que vence em 29 dias (dentro da janela de 30 dias)", () => {
    const ids = selectSealsNearingExpiry([{ id: "b1", seloValidoAte: inDays(29) }], NOW);
    expect(ids).toEqual(["b1"]);
  });

  it("nao avisa um selo que vence em 31 dias (ainda fora da janela)", () => {
    const ids = selectSealsNearingExpiry([{ id: "b1", seloValidoAte: inDays(31) }], NOW);
    expect(ids).toEqual([]);
  });

  it("nao avisa um selo que ja' venceu (isso e' expiracao, nao aviso)", () => {
    const ids = selectSealsNearingExpiry([{ id: "b1", seloValidoAte: daysAgo(1) }], NOW);
    expect(ids).toEqual([]);
  });

  it("ignora negocio sem selo_valido_ate", () => {
    const ids = selectSealsNearingExpiry([{ id: "b1", seloValidoAte: null }], NOW);
    expect(ids).toEqual([]);
  });
});
