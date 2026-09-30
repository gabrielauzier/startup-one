import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Typography } from "../typography";

describe("Typography", () => {
  it("renderiza a tag do variant por padrão", () => {
    render(<Typography variant="h1">Título</Typography>);
    const el = screen.getByText("Título");
    expect(el.tagName).toBe("H1");
    expect(el).toHaveClass("font-heading", "text-4xl", "font-normal", "text-foreground");
  });

  it("'as' sobrescreve a tag do variant, sem mudar o estilo do variant", () => {
    render(
      <Typography variant="h2" as="div">
        Título como div
      </Typography>,
    );
    const el = screen.getByText("Título como div");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass("font-heading", "text-3xl");
  });

  it("size/weight/color explícitos sobrescrevem o preset do variant eixo a eixo", () => {
    render(
      <Typography variant="body" size="lg" weight="bold" color="destructive">
        Aviso
      </Typography>,
    );
    const el = screen.getByText("Aviso");
    expect(el.tagName).toBe("P");
    expect(el).toHaveClass("font-body", "text-lg", "font-bold", "text-destructive");
  });

  it("variant 'label' usa peso medium e renderiza <label>", () => {
    render(<Typography variant="label">Nome</Typography>);
    const el = screen.getByText("Nome");
    expect(el.tagName).toBe("LABEL");
    expect(el).toHaveClass("font-medium");
  });

  it("repassa atributos como data-testid e htmlFor", () => {
    render(
      <Typography variant="label" as="label" htmlFor="campo" data-testid="rotulo-campo">
        Rótulo
      </Typography>,
    );
    const el = screen.getByTestId("rotulo-campo");
    expect(el).toHaveAttribute("for", "campo");
  });
});
