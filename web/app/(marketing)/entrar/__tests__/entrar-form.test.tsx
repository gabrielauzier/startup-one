import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";

const signInPassword = vi.fn();
vi.mock("../actions", () => ({ signInPassword: (...a: unknown[]) => signInPassword(...a) }));
vi.mock("../magic-link-actions", () => ({
  requestMagicLink: vi.fn(),
  resendConfirmation: vi.fn(),
}));

import { EntrarForm } from "../entrar-form";

describe("EntrarForm (AUTH-05)", () => {
  it("sem selecao de perfil, com e-mail, senha, Entrar e os tres links", () => {
    render(<EntrarForm redirectTo="" notice={null} />);

    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.getByLabelText("E-mail")).toBeTruthy();
    expect(screen.getByLabelText("Senha")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mostrar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Esqueci minha senha" }).getAttribute("href")).toBe(
      "/esqueci-senha"
    );
    expect(
      screen.getByRole("button", { name: "Receber link de acesso por e-mail" })
    ).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Criar conta" })[0].getAttribute("href")).toBe(
      "/cadastro"
    );
  });

  it("usa os autocompletes de e-mail e senha atual", () => {
    render(<EntrarForm redirectTo="" notice={null} />);

    expect(screen.getByLabelText("E-mail").getAttribute("autocomplete")).toBe("email");
    expect(screen.getByLabelText("Senha").getAttribute("autocomplete")).toBe("current-password");
  });

  it("Mostrar alterna o campo de senha entre password e text", () => {
    render(<EntrarForm redirectTo="" notice={null} />);
    const senha = screen.getByLabelText("Senha");

    expect(senha.getAttribute("type")).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: "Mostrar" }));
    expect(senha.getAttribute("type")).toBe("text");
    expect(screen.getByRole("button", { name: "Ocultar" })).toBeTruthy();
  });

  it("mostra o texto para contas do MVP sem senha", () => {
    render(<EntrarForm redirectTo="" notice={null} />);

    expect(
      screen.getByText(
        "Primeiro acesso depois da atualização? Use o link por e-mail ou redefina sua senha."
      )
    ).toBeTruthy();
  });

  it.each([
    ["continuar", "Entre para continuar"],
    ["sem-permissao", "Essa área é de outro perfil. Entre com a conta certa ou volte."],
    ["senha-alterada", "Senha alterada. Entre com a nova senha."],
    ["link-expirado", "Esse link já foi usado ou venceu. Peça outro."],
  ] as const)("notice %s mostra o aviso de contexto", (notice, text) => {
    render(<EntrarForm redirectTo="/produtor/painel" notice={notice} />);

    expect(screen.getByRole("status").textContent).toContain(text);
  });

  it("sem notice nao mostra faixa de aviso", () => {
    render(<EntrarForm redirectTo="" notice={null} />);

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("carrega o redirect em campo oculto", () => {
    const { container } = render(<EntrarForm redirectTo="/negocios/x" notice="continuar" />);

    expect(
      (container.querySelector('input[name="redirect"]') as HTMLInputElement).value
    ).toBe("/negocios/x");
  });

  it("enquanto envia, o botao Entrar fica desabilitado e mostra 'Entrando…' (AUTH-05 critério 5)", async () => {
    signInPassword.mockReturnValue(new Promise(() => {}));
    const { container } = render(<EntrarForm redirectTo="" notice={null} />);
    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "abc12345" } });

    await act(async () => {
      container.querySelector("form")!.requestSubmit();
    });

    const botao = screen.getByRole("button", { name: "Entrando…" }) as HTMLButtonElement;
    expect(botao.disabled).toBe(true);
  });

  it("campos e botoes de acao tem altura de 44px (h-11) para toque (AUTH-05 critério 14)", () => {
    render(<EntrarForm redirectTo="" notice={null} />);

    for (const el of [
      screen.getByLabelText("E-mail"),
      screen.getByLabelText("Senha"),
      screen.getByRole("button", { name: "Entrar" }),
      screen.getByRole("button", { name: "Receber link de acesso por e-mail" }),
    ]) {
      expect(el.className, el.outerHTML.slice(0, 60)).toContain("h-11");
    }
    expect(screen.getByRole("link", { name: "Esqueci minha senha" }).className).toContain("min-h-11");
    expect(screen.getByRole("button", { name: "Mostrar" }).className).toContain("min-w-11");
  });

  it("a area de erro e uma regiao role=alert", () => {
    render(<EntrarForm redirectTo="" notice={null} />);

    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("a aba Entrar esta marcada como pagina atual", () => {
    render(<EntrarForm redirectTo="" notice={null} />);

    const tabs = screen.getByRole("navigation", { name: "Entrar ou criar conta" });
    expect(tabs.querySelector('[aria-current="page"]')?.textContent).toBe("Entrar");
  });
});
