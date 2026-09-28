import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BusinessCard, type BusinessSummary } from "../BusinessCard";

const FORBIDDEN_TERMS = [
  "investir agora",
  "rendimento",
  "retorno garantido",
  "captado",
  "captação",
];

const business: BusinessSummary = {
  slug: "castanha-solidaria-xingu",
  nome: "Castanha Solidária Xingu",
  cidade: "Altamira",
  uf: "PA",
  produtos: ["Castanha"],
  fotoUrl: null,
  valorBusca: 180_000,
  prazoMeses: 24,
  retornoProposto: 12.5,
  notaA: 90,
  notaS: 80,
  notaG: 70,
  certificadoras: ["IBD", "FSC"],
  recebeVisitas: true,
  interesseSomado: 95_000,
};

describe("BusinessCard (RN-28)", () => {
  it("CA-28.1: mostra selo, notas, busca, prazo e retorno proposto", () => {
    render(<BusinessCard business={business} />);

    expect(screen.getByText("Verificado Îasy")).toBeInTheDocument();
    expect(screen.getByText(/Ambiental 90/)).toBeInTheDocument();
    expect(screen.getByText(/Social 80/)).toBeInTheDocument();
    expect(screen.getByText(/Gestão 70/)).toBeInTheDocument();
    expect(screen.getByText(/Busca/)).toBeInTheDocument();
    expect(screen.getByText(/Prazo 24 meses/)).toBeInTheDocument();
    expect(screen.getByText(/Retorno proposto 12\.5% ao ano/)).toBeInTheDocument();
  });

  it("mostra nome, produto/cidade, siglas de certificadoras e a barra de interesse", () => {
    render(<BusinessCard business={business} />);

    expect(screen.getByText("Castanha Solidária Xingu")).toBeInTheDocument();
    expect(screen.getByText(/Castanha · Altamira\/PA/)).toBeInTheDocument();
    expect(screen.getByText("IBD")).toBeInTheDocument();
    expect(screen.getByText("FSC")).toBeInTheDocument();
    expect(
      screen.getByText(/Interesse de investidores: R\$\s?95\.000 de R\$\s?180\.000/)
    ).toBeInTheDocument();
  });

  it("mostra '% alinhado' apenas quando alignment é informado (resultados vs. vitrine)", () => {
    const { rerender } = render(<BusinessCard business={business} />);
    expect(screen.queryByText(/% alinhado/)).not.toBeInTheDocument();

    rerender(<BusinessCard business={business} alignment={94} />);
    expect(screen.getByText("94% alinhado ao seu perfil")).toBeInTheDocument();
  });

  it("o card inteiro leva à página do negócio", () => {
    render(<BusinessCard business={business} />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/negocios/castanha-solidaria-xingu"
    );
  });

  it("CA-28.2: nenhum termo proibido de RN-04 aparece no markup renderizado", () => {
    const { container } = render(<BusinessCard business={business} alignment={94} />);
    const html = container.innerHTML.toLowerCase();

    for (const term of FORBIDDEN_TERMS) {
      expect(html).not.toContain(term);
    }
  });
});
