import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../actions", () => ({ createBusiness: vi.fn() }));

import { BoasVindasForm } from "../boas-vindas-form";

describe("BoasVindasForm (AUTH-17, critério 11)", () => {
  it("para visitante, Começar cadastro e um link para /cadastro?perfil=produtor, sem a pergunta de indicacao", () => {
    render(<BoasVindasForm partners={[]} isProducer={false} />);

    expect(screen.getByRole("link", { name: "Começar cadastro" }).getAttribute("href")).toBe(
      "/cadastro?perfil=produtor"
    );
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.queryByRole("button", { name: "Começar cadastro" })).toBeNull();
  });

  it("para o produtor logado mantem a pergunta de indicacao e o botao que cria o negocio", () => {
    render(<BoasVindasForm partners={[{ id: "p1", nome: "Coop A" }]} isProducer />);

    expect(screen.getByRole("radiogroup")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Começar cadastro" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Começar cadastro" })).toBeNull();
  });
});
