import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../actions", () => ({ signUpAction: vi.fn() }));

import { CadastroForm } from "../cadastro-form";

const submit = () => screen.getByRole("button", { name: "Criar conta" }) as HTMLButtonElement;
const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("CadastroForm (AUTH-02)", () => {
  it("mostra os 3 perfis, nome, e-mail, senha e confirmacao", () => {
    render(<CadastroForm initialRole={null} />);

    expect(screen.getAllByRole("radio").map((r) => r.textContent)).toEqual([
      "Quero investir",
      "Represento uma empresa",
      "Produzo na Amazônia",
    ]);
    for (const label of ["Nome", "E-mail", "Senha", "Confirmar senha"]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it.each([
    ["produtor", "Produzo na Amazônia"],
    ["investidor", "Quero investir"],
    ["empresa", "Represento uma empresa"],
  ] as const)("initialRole=%s vem com o perfil marcado", (role, label) => {
    render(<CadastroForm initialRole={role} />);

    expect(screen.getByRole("radio", { name: label }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getAllByRole("radio").filter((r) => r.getAttribute("aria-checked") === "true")).toHaveLength(1);
  });

  it("sem initialRole nenhum perfil vem marcado e o envio fica bloqueado", () => {
    render(<CadastroForm initialRole={null} />);

    expect(screen.getAllByRole("radio").every((r) => r.getAttribute("aria-checked") === "false")).toBe(true);
    expect(submit().disabled).toBe(true);
  });

  it("senha com 7 caracteres mostra o requisito no campo e bloqueia o envio", () => {
    render(<CadastroForm initialRole="investidor" />);

    type("Senha", "abc1234");

    expect(screen.getByText("Use ao menos 8 caracteres.")).toBeTruthy();
    expect(submit().disabled).toBe(true);
  });

  it("senha sem numero mostra 'Inclua ao menos 1 número.'", () => {
    render(<CadastroForm initialRole="investidor" />);

    type("Senha", "somenteletras");

    expect(screen.getByText("Inclua ao menos 1 número.")).toBeTruthy();
  });

  it("confirmacao diferente mostra o erro no campo de confirmacao e bloqueia", () => {
    render(<CadastroForm initialRole="investidor" />);

    type("Senha", "abc12345");
    type("Confirmar senha", "abc12346");

    expect(screen.getByText("As senhas não são iguais.")).toBeTruthy();
    expect(submit().disabled).toBe(true);
  });

  it("senha valida e confirmacao igual com perfil marcado libera o envio", () => {
    render(<CadastroForm initialRole="investidor" />);

    type("Senha", "abc12345");
    type("Confirmar senha", "abc12345");

    expect(submit().disabled).toBe(false);
  });

  it("usa autocomplete new-password nos dois campos de senha e e-mail no de e-mail", () => {
    render(<CadastroForm initialRole="investidor" />);

    expect(screen.getByLabelText("Senha").getAttribute("autocomplete")).toBe("new-password");
    expect(screen.getByLabelText("Confirmar senha").getAttribute("autocomplete")).toBe("new-password");
    expect(screen.getByLabelText("E-mail").getAttribute("autocomplete")).toBe("email");
  });
});
