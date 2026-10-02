import { describe, expect, it } from "vitest";
import { canRequestAccess, computeDocumentSituation } from "../document-status";

const NOW = new Date("2026-06-15T12:00:00Z");

describe("computeDocumentSituation", () => {
  it("documento aberto a todos e sempre 'aberto_a_todos', mesmo com pedido", () => {
    expect(computeDocumentSituation(true, null, NOW)).toEqual({ kind: "aberto_a_todos" });
  });

  it("documento sensivel sem nenhum pedido e 'precisa_liberacao'", () => {
    expect(computeDocumentSituation(false, null, NOW)).toEqual({ kind: "precisa_liberacao" });
  });

  it("CA-32.1: pedido pendente recente e 'pedido_enviado' (botao some)", () => {
    const situation = computeDocumentSituation(
      false,
      { status: "pendente", createdAt: "2026-06-14T12:00:00Z", expiraEm: null },
      NOW
    );
    expect(situation).toEqual({ kind: "pedido_enviado" });
    expect(canRequestAccess(situation)).toBe(false);
  });

  it("RN-32: pedido pendente ha 7+ dias volta a 'precisa_liberacao' (pode refazer)", () => {
    const situation = computeDocumentSituation(
      false,
      { status: "pendente", createdAt: "2026-06-08T12:00:00Z", expiraEm: null },
      NOW
    );
    expect(situation).toEqual({ kind: "precisa_liberacao" });
    expect(canRequestAccess(situation)).toBe(true);
  });

  it("pedido liberado dentro dos 30 dias e 'liberado'", () => {
    const situation = computeDocumentSituation(
      false,
      {
        status: "liberado",
        createdAt: "2026-06-01T00:00:00Z",
        expiraEm: "2026-07-01T00:00:00Z",
      },
      NOW
    );
    expect(situation).toEqual({ kind: "liberado" });
  });

  it("CA-33.1: pedido liberado ha 31 dias e 'acesso_expirado' (pode solicitar de novo)", () => {
    const situation = computeDocumentSituation(
      false,
      {
        status: "liberado",
        createdAt: "2026-05-14T12:00:00Z",
        expiraEm: "2026-06-13T12:00:00Z",
      },
      NOW
    );
    expect(situation).toEqual({ kind: "acesso_expirado" });
    expect(canRequestAccess(situation)).toBe(true);
  });

  it("CA-32.3: pedido recusado e 'nao_liberado', sem opcao de refazer", () => {
    const situation = computeDocumentSituation(
      false,
      { status: "recusado", createdAt: "2026-06-10T00:00:00Z", expiraEm: null },
      NOW
    );
    expect(situation).toEqual({ kind: "nao_liberado" });
    expect(canRequestAccess(situation)).toBe(false);
  });

  it("CA-33.2: acesso retirado pela produtora e 'nao_liberado'", () => {
    const situation = computeDocumentSituation(
      false,
      { status: "retirado", createdAt: "2026-06-01T00:00:00Z", expiraEm: null },
      NOW
    );
    expect(situation).toEqual({ kind: "nao_liberado" });
  });

  it("pedido ja marcado 'expirado' (cron do T53) volta a 'precisa_liberacao'", () => {
    const situation = computeDocumentSituation(
      false,
      { status: "expirado", createdAt: "2026-06-01T00:00:00Z", expiraEm: null },
      NOW
    );
    expect(situation).toEqual({ kind: "precisa_liberacao" });
  });
});
