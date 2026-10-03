import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../actions", () => ({ verifyResetCode: vi.fn() }));

import { CodigoForm } from "../codigo-form";

const paste = (el: HTMLElement, text: string) =>
  fireEvent.paste(el, { clipboardData: { getData: () => text } });

describe("CodigoForm (AUTH-08 critério 9)", () => {
  it("tem inputmode numerico, autocomplete one-time-code e maxLength 6", () => {
    render(<CodigoForm />);
    const input = screen.getByLabelText("Código de 6 dígitos");

    expect(input.getAttribute("inputmode")).toBe("numeric");
    expect(input.getAttribute("autocomplete")).toBe("one-time-code");
    expect(input.getAttribute("maxlength")).toBe("6");
  });

  it("colar '123 456' deixa so os 6 digitos no campo", () => {
    render(<CodigoForm />);
    const input = screen.getByLabelText("Código de 6 dígitos") as HTMLInputElement;

    const notPrevented = paste(input, "123 456");

    expect(input.value).toBe("123456");
    // o handler assume o colar: sem preventDefault o navegador inseriria "123 456" truncado
    expect(notPrevented).toBe(false);
  });

  it("colar texto com mais de 6 digitos corta nos 6 primeiros e texto sem digitos nao altera", () => {
    render(<CodigoForm />);
    const input = screen.getByLabelText("Código de 6 dígitos") as HTMLInputElement;

    paste(input, "código: 12345678");
    expect(input.value).toBe("123456");

    input.value = "";
    paste(input, "abc");
    expect(input.value).toBe("");
  });
});
