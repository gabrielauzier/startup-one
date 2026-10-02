import { describe, it, expect } from "vitest";
import { sumInterests, formatInterestSummary, type Interest } from "../interest-sum";

describe("sumInterests / formatInterestSummary (RN-29)", () => {
  it("CA-29.1: R$15 mil aceito + R$80 mil pendente de R$180 mil -> 'R$ 95 mil de R$ 180 mil'", () => {
    const interests: Interest[] = [
      { valor: 15_000, status: "aceito" },
      { valor: 80_000, status: "pendente" },
    ];

    const result = sumInterests(interests, 180_000);

    expect(result.somaAbsoluta).toBe(95_000);
    expect(formatInterestSummary(result.somaAbsoluta, 180_000)).toBe("R$ 95 mil de R$ 180 mil");
  });

  it("CA-29.2: interesse recusado ou cancelado sai da soma", () => {
    const interests: Interest[] = [
      { valor: 15_000, status: "aceito" },
      { valor: 80_000, status: "pendente" },
      { valor: 50_000, status: "recusado" },
      { valor: 30_000, status: "cancelado" },
      { valor: 20_000, status: "expirado" },
    ];

    const result = sumInterests(interests, 180_000);

    expect(result.somaAbsoluta).toBe(95_000);
  });

  it("limita a barra a 100% mesmo que a soma exceda o valor buscado (RN-29)", () => {
    const interests: Interest[] = [
      { valor: 120_000, status: "aceito" },
      { valor: 90_000, status: "pendente" },
    ];

    const result = sumInterests(interests, 180_000);

    expect(result.somaAbsoluta).toBe(210_000); // texto mostra a soma real, sem limitar
    expect(result.percentualBarra).toBe(100); // barra visual limitada a 100%
  });

  it("sem nenhum interesse, soma e percentual ficam em zero", () => {
    const result = sumInterests([], 100_000);
    expect(result).toEqual({ somaAbsoluta: 0, percentualBarra: 0 });
  });

  it("calcula o percentual proporcional quando a soma não excede o buscado", () => {
    const interests: Interest[] = [{ valor: 45_000, status: "pendente" }];
    const result = sumInterests(interests, 180_000);
    expect(result.percentualBarra).toBe(25);
  });
});
