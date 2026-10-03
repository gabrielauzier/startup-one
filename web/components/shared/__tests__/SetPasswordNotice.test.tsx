import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

let pathname = "/negocios";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(""),
}));
vi.mock("@/lib/auth/sign-out", () => ({ signOutAction: vi.fn() }));

import { AppChrome } from "../AppChrome";
import { SetPasswordNotice } from "../SetPasswordNotice";

beforeEach(() => {
  window.sessionStorage.clear();
  pathname = "/negocios";
});

describe("SetPasswordNotice (AUTH-18)", () => {
  it("mostra o convite com link para /redefinir-senha", () => {
    render(<SetPasswordNotice />);

    expect(screen.getByText(/Defina uma senha para entrar mais rápido/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Definir senha" }).getAttribute("href")).toBe(
      "/redefinir-senha"
    );
  });

  it("dispensar esconde o aviso e ele nao volta na mesma sessao do navegador", () => {
    const { unmount } = render(<SetPasswordNotice />);

    fireEvent.click(screen.getByRole("button", { name: "Dispensar aviso de senha" }));
    expect(screen.queryByRole("region", { name: "Defina uma senha" })).toBeNull();
    unmount();

    render(<SetPasswordNotice />);
    expect(screen.queryByRole("region", { name: "Defina uma senha" })).toBeNull();
  });
});

describe("AppChrome com needsPassword (AUTH-18)", () => {
  it("usuario sem senha ve o aviso", () => {
    render(
      <AppChrome role="produtor" needsPassword>
        <p>x</p>
      </AppChrome>
    );

    expect(screen.getByRole("region", { name: "Defina uma senha" })).toBeTruthy();
  });

  it("quem ja tem senha nao ve o aviso", () => {
    render(
      <AppChrome role="produtor" needsPassword={false}>
        <p>x</p>
      </AppChrome>
    );

    expect(screen.queryByRole("region", { name: "Defina uma senha" })).toBeNull();
  });

  it("nao aparece nas telas de auth", () => {
    pathname = "/redefinir-senha";
    render(
      <AppChrome role="produtor" needsPassword>
        <p>x</p>
      </AppChrome>
    );

    expect(screen.queryByRole("region", { name: "Defina uma senha" })).toBeNull();
  });
});
