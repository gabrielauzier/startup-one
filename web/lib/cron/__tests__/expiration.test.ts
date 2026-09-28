import { describe, it, expect } from "vitest";
import {
  selectExpiredDrafts,
  selectExpiredPendingDocumentRequests,
  selectExpiredReleasedAccess,
  selectExpiredPendingInterests,
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

  it("nao expira rascunho criado ha menos de 90 dias", () => {
    const ids = selectExpiredDrafts(
      [{ id: "a", createdAt: daysAgo(10), lastRevisionAt: null }],
      NOW
    );
    expect(ids).toEqual([]);
  });
});

describe("selectExpiredPendingDocumentRequests (RN-32, T55)", () => {
  it("expira pedido pendente sem resposta ha mais de 7 dias", () => {
    const ids = selectExpiredPendingDocumentRequests([{ id: "r1", createdAt: daysAgo(8) }], NOW);
    expect(ids).toEqual(["r1"]);
  });

  it("nao expira pedido pendente com menos de 7 dias", () => {
    const ids = selectExpiredPendingDocumentRequests([{ id: "r1", createdAt: daysAgo(3) }], NOW);
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
  it("expira interesse pendente sem resposta ha mais de 10 dias", () => {
    const ids = selectExpiredPendingInterests([{ id: "i1", createdAt: daysAgo(11) }], NOW);
    expect(ids).toEqual(["i1"]);
  });

  it("nao expira interesse pendente com menos de 10 dias", () => {
    const ids = selectExpiredPendingInterests([{ id: "i1", createdAt: daysAgo(2) }], NOW);
    expect(ids).toEqual([]);
  });
});
