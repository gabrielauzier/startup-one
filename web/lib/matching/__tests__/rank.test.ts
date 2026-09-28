import { describe, it, expect } from "vitest";
import { sortByAlignment, type RankableBusiness } from "../rank";

describe("sortByAlignment (RN-24: empate por média das notas, depois verificação mais recente)", () => {
  it("ordena por alinhamento decrescente quando não há empate", () => {
    const items: RankableBusiness[] = [
      { alignment: 60, notaA: 50, notaS: 50, notaG: 50, verificadoEm: null },
      { alignment: 94, notaA: 50, notaS: 50, notaG: 50, verificadoEm: null },
      { alignment: 40, notaA: 50, notaS: 50, notaG: 50, verificadoEm: null },
    ];
    expect(sortByAlignment(items).map((i) => i.alignment)).toEqual([94, 60, 40]);
  });

  it("empate no alinhamento: desempata pela média das 3 notas (maior primeiro)", () => {
    const items: RankableBusiness[] = [
      { alignment: 80, notaA: 60, notaS: 60, notaG: 60, verificadoEm: null }, // média 60
      { alignment: 80, notaA: 90, notaS: 90, notaG: 90, verificadoEm: null }, // média 90
      { alignment: 80, notaA: 75, notaS: 75, notaG: 75, verificadoEm: null }, // média 75
    ];
    expect(sortByAlignment(items).map((i) => i.notaA)).toEqual([90, 75, 60]);
  });

  it("empate no alinhamento e na média: desempata pela verificação mais recente", () => {
    const items: RankableBusiness[] = [
      { alignment: 80, notaA: 70, notaS: 70, notaG: 70, verificadoEm: "2026-01-01T00:00:00Z" },
      { alignment: 80, notaA: 70, notaS: 70, notaG: 70, verificadoEm: "2026-06-01T00:00:00Z" },
      { alignment: 80, notaA: 70, notaS: 70, notaG: 70, verificadoEm: "2026-03-01T00:00:00Z" },
    ];
    expect(sortByAlignment(items).map((i) => i.verificadoEm)).toEqual([
      "2026-06-01T00:00:00Z",
      "2026-03-01T00:00:00Z",
      "2026-01-01T00:00:00Z",
    ]);
  });

  it("não muta o array original", () => {
    const items: RankableBusiness[] = [
      { alignment: 40, notaA: 0, notaS: 0, notaG: 0, verificadoEm: null },
      { alignment: 90, notaA: 0, notaS: 0, notaG: 0, verificadoEm: null },
    ];
    const original = [...items];
    sortByAlignment(items);
    expect(items).toEqual(original);
  });
});
