import { describe, expect, it } from "vitest";
import { calculateAlignment, type BusinessForMatching, type InvestorAnswers } from "../score";

describe("calculateAlignment (RN-24)", () => {
  // CA-24.1: caso literal da PRD (mvp/prd-mvp.md, RN-24), reproduzido
  // aqui exatamente como descrito - nao inventamos uma formula nova
  // para bater com o resultado, so' aplicamos a tabela de pesos da
  // RN-24 aos dados do proprio exemplo.
  //
  // "negocio de açai que busca R$ 180 mil em 24 meses, com impactos
  // Floresta em pé e Renda para as famílias e Ambiental 90, e uma
  // investidora com Alimentos, R$ 50 a 200 mil, até 24 meses, 3
  // impactos (os dois do negócio e Mulheres na liderança) e Impacto
  // primeiro [...] o resultado é 30 + 25 + 20 + 10 + 9 = 94%."
  it("CA-24.1: reproduz o caso literal da PRD e chega a 94%", () => {
    const answers: InvestorAnswers = {
      prioridade: "impacto", // "Impacto primeiro" -> usa a nota Ambiental
      faixaValor: "50_200k", // "R$ 50 a 200 mil"
      produtos: ["Alimentos"],
      prazoMaxMeses: 24, // "até 24 meses"
      impactos: ["Floresta em pé", "Renda para as famílias", "Mulheres na liderança"],
    };
    const business: BusinessForMatching = {
      produtos: ["Açaí"], // conta como categoria "Alimentos" (RN-24)
      valorBusca: 180_000,
      prazoMeses: 24,
      impactos: ["Floresta em pé", "Renda para as famílias"],
      notaA: 90,
      notaS: 0,
      notaG: 0,
    };

    // Produto: 30 (Açaí -> Alimentos, escolhido)
    // Valor: 25 (180 mil está na faixa 50-200 mil escolhida)
    // Prazo: 20 (24 <= 24 meses aceitos)
    // Impacto: 15 * (2 comuns / 3 escolhidos) = 10
    // Prioridade: 10 * 90 / 100 = 9
    // Total: 30 + 25 + 20 + 10 + 9 = 94
    expect(calculateAlignment(answers, business)).toBe(94);
  });

  // CA-24.2: um negócio com 35% de alinhamento fica fora dos
  // resultados (corte de 40% aplicado pela tela de resultados, T36) -
  // aqui só garantimos que a função devolve o valor correto abaixo do
  // corte, sem a função conhecer a regra de corte em si.
  it("CA-24.2: produz 35% para um negócio pouco alinhado (abaixo do corte de 40%)", () => {
    const answers: InvestorAnswers = {
      prioridade: "retorno", // usa a nota de Gestão
      faixaValor: "ate_50k",
      produtos: ["Alimentos"],
      prazoMaxMeses: 12,
      impactos: ["Floresta em pé"],
    };
    const business: BusinessForMatching = {
      produtos: ["Açaí"], // Alimentos -> match de produto: 30
      // 250 mil cai na faixa "acima_200k", a duas posições de distância
      // da faixa "ate_50k" escolhida pelo investidor -> 0 pontos de valor.
      valorBusca: 250_000,
      prazoMeses: 36, // 36 > 12 + 12 = 24 -> 0
      impactos: ["Jovens no campo"], // sem sobreposição -> 0
      notaA: 0,
      notaS: 0,
      notaG: 50, // prioridade "retorno" -> 10 * 50 / 100 = 5
    };

    // Produto: 30, Valor: 0 (acima_200k vs ate_50k, distância 2),
    // Prazo: 0, Impacto: 0, Prioridade: 5 -> total 35.
    const result = calculateAlignment(answers, business);
    expect(result).toBe(35);
    expect(result).toBeLessThan(40); // fica fora do corte de RN-24 (>= 40%)
  });

  // Fix 7 (rodada 1 do Verifier): faixa vizinha vale 10 pontos parciais
  // de Valor - nem os 25 cheios (faixa exata) nem 0 (faixa a 2+ de
  // distância). Sensor M1 (score.ts:97, "10 -> 0") sobreviveu por
  // faltar este caso - só havia teste para faixa igual (25) e faixa a
  // 2 posições de distância (0).
  it("faixa de valor vizinha (distância 1) vale 10 pontos parciais, nem 25 nem 0 (kills M1)", () => {
    const answers: InvestorAnswers = {
      prioridade: "equilibrio",
      faixaValor: "ate_50k",
      produtos: ["Todos"],
      prazoMaxMeses: 12,
      impactos: [], // pular -> 8 pontos fixos
    };
    const business: BusinessForMatching = {
      produtos: ["Açaí"], // "Todos" -> match de produto: 30
      // 100 mil cai na faixa "50_200k", vizinha (distância 1) da faixa
      // "ate_50k" escolhida -> 10 pontos parciais de valor.
      valorBusca: 100_000,
      prazoMeses: 12, // <= 12 aceitos -> 20
      impactos: [],
      notaA: 0,
      notaS: 0,
      notaG: 0, // prioridade "equilibrio" -> média 0 -> 0
    };

    // Produto: 30, Valor: 10 (faixa vizinha), Prazo: 20, Impacto: 8
    // (pulado), Prioridade: 0 -> total 68.
    expect(calculateAlignment(answers, business)).toBe(68);
  });

  // CA-24.3: função pura - mesma entrada, mesma saída, sem mutação.
  it("CA-24.3: é determinística em execuções repetidas e não muta as entradas", () => {
    const answers: InvestorAnswers = {
      prioridade: "equilibrio",
      faixaValor: "50_200k",
      produtos: ["Todos"],
      prazoMaxMeses: 18,
      impactos: ["Floresta em pé", "Renda para as famílias"],
    };
    const business: BusinessForMatching = {
      produtos: ["Cacau"],
      valorBusca: 120_000,
      prazoMeses: 18,
      impactos: ["Renda para as famílias"],
      notaA: 80,
      notaS: 70,
      notaG: 60,
    };

    const answersSnapshot = JSON.parse(JSON.stringify(answers));
    const businessSnapshot = JSON.parse(JSON.stringify(business));

    const first = calculateAlignment(answers, business);
    const second = calculateAlignment(answers, business);
    const third = calculateAlignment(answers, business);

    expect(first).toBe(second);
    expect(second).toBe(third);
    expect(answers).toEqual(answersSnapshot);
    expect(business).toEqual(businessSnapshot);
  });

  it("marcar 'Todos' na pergunta 3 dá 30 pontos de produto para qualquer negócio", () => {
    const answers: InvestorAnswers = {
      prioridade: "impacto",
      faixaValor: "ate_50k",
      produtos: ["todos"],
      prazoMaxMeses: 12,
      impactos: [],
    };
    const business: BusinessForMatching = {
      produtos: ["Copaíba"],
      valorBusca: 50_000,
      prazoMeses: 12,
      impactos: [],
      notaA: 0,
      notaS: 0,
      notaG: 0,
    };
    // Produto: 30, Valor: 25, Prazo: 20, Impacto (pulada): 8, Prioridade: 0
    expect(calculateAlignment(answers, business)).toBe(83);
  });

  it("pergunta 5 pulada (impactos ausentes) vale 8 pontos fixos (CA-22.3)", () => {
    const base: InvestorAnswers = {
      prioridade: "impacto",
      faixaValor: "ate_50k",
      produtos: ["todos"],
      prazoMaxMeses: 12,
      impactos: undefined,
    };
    const business: BusinessForMatching = {
      produtos: ["Açaí"],
      valorBusca: 50_000,
      prazoMeses: 12,
      impactos: ["Floresta em pé"],
      notaA: 0,
      notaS: 0,
      notaG: 0,
    };
    expect(calculateAlignment(base, business)).toBe(30 + 25 + 20 + 8 + 0);
  });

  it("prazo do negócio até 12 meses além do aceito vale 8 pontos", () => {
    const answers: InvestorAnswers = {
      prioridade: "impacto",
      faixaValor: "ate_50k",
      produtos: ["todos"],
      prazoMaxMeses: 12,
      impactos: [],
    };
    const business: BusinessForMatching = {
      produtos: ["Açaí"],
      valorBusca: 50_000,
      prazoMeses: 24, // 24 - 12 = 12 -> dentro do limite de tolerância
      impactos: [],
      notaA: 0,
      notaS: 0,
      notaG: 0,
    };
    expect(calculateAlignment(answers, business)).toBe(30 + 25 + 8 + 8 + 0);
  });

  it("prazo do negócio além da tolerância de 12 meses vale 0", () => {
    const answers: InvestorAnswers = {
      prioridade: "impacto",
      faixaValor: "ate_50k",
      produtos: ["todos"],
      prazoMaxMeses: 12,
      impactos: [],
    };
    const business: BusinessForMatching = {
      produtos: ["Açaí"],
      valorBusca: 50_000,
      prazoMeses: 36, // 36 - 12 = 24 -> fora da tolerância
      impactos: [],
      notaA: 0,
      notaS: 0,
      notaG: 0,
    };
    expect(calculateAlignment(answers, business)).toBe(30 + 25 + 0 + 8 + 0);
  });

  it("prioridade 'equilibrio' usa a média das 3 notas", () => {
    const answers: InvestorAnswers = {
      prioridade: "equilibrio",
      faixaValor: "ate_50k",
      produtos: ["todos"],
      prazoMaxMeses: 12,
      impactos: [],
    };
    const business: BusinessForMatching = {
      produtos: ["Açaí"],
      valorBusca: 50_000,
      prazoMeses: 12,
      impactos: [],
      notaA: 90,
      notaS: 60,
      notaG: 30, // média = 60 -> 10 * 60 / 100 = 6
    };
    expect(calculateAlignment(answers, business)).toBe(30 + 25 + 20 + 8 + 6);
  });

  it("produto fora de qualquer categoria escolhida vale 0", () => {
    const answers: InvestorAnswers = {
      prioridade: "impacto",
      faixaValor: "ate_50k",
      produtos: ["Cosméticos"],
      prazoMaxMeses: 12,
      impactos: [],
    };
    const business: BusinessForMatching = {
      produtos: ["Cacau"], // Cacau -> Cacau, Alimentos (nenhuma é Cosméticos)
      valorBusca: 50_000,
      prazoMeses: 12,
      impactos: [],
      notaA: 0,
      notaS: 0,
      notaG: 0,
    };
    expect(calculateAlignment(answers, business)).toBe(0 + 25 + 20 + 8 + 0);
  });
});
