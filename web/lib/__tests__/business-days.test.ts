import { describe, it, expect } from "vitest";
import { businessDaysBetween, classifyQueueUrgency } from "../business-days";

describe("businessDaysBetween (RN-16)", () => {
  it("conta so' dias uteis entre duas datas, ignorando sabado e domingo", () => {
    // segunda 2026-09-28 -> segunda 2026-10-05 = 5 dias uteis (ter..seg)
    const from = new Date("2026-09-28T09:00:00Z");
    const to = new Date("2026-10-05T09:00:00Z");
    expect(businessDaysBetween(from, to)).toBe(5);
  });

  it("retorna 0 quando o intervalo cai todo num fim de semana", () => {
    const from = new Date("2026-10-03T09:00:00Z"); // sabado
    const to = new Date("2026-10-04T09:00:00Z"); // domingo
    expect(businessDaysBetween(from, to)).toBe(0);
  });

  it("retorna 0 quando to <= from", () => {
    const date = new Date("2026-09-28T09:00:00Z");
    expect(businessDaysBetween(date, date)).toBe(0);
  });
});

describe("classifyQueueUrgency (RN-16/CA-16.1)", () => {
  it("classifica exatamente 4 dias uteis como amarelo", () => {
    expect(classifyQueueUrgency(4)).toBe("amarelo");
  });

  it("classifica exatamente 6 dias uteis como vermelho", () => {
    expect(classifyQueueUrgency(6)).toBe("vermelho");
  });

  it("classifica 3 dias uteis (limite) como normal", () => {
    expect(classifyQueueUrgency(3)).toBe("normal");
  });

  it("classifica 5 dias uteis (limite) como amarelo", () => {
    expect(classifyQueueUrgency(5)).toBe("amarelo");
  });

  it("classifica 0 dias uteis como normal", () => {
    expect(classifyQueueUrgency(0)).toBe("normal");
  });
});
