import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const signOutAction = vi.fn();
vi.mock("@/lib/auth/sign-out", () => ({ signOutAction: (...a: unknown[]) => signOutAction(...a) }));

import { SiteHeader } from "../SiteHeader";

describe("SiteHeader (AUTH-16)", () => {
  it("visitante (role null) ve o link Entrar para /entrar e nao ve Sair", () => {
    render(<SiteHeader role={null} />);

    const entrar = screen.getByRole("link", { name: "Entrar" });
    expect(entrar.getAttribute("href")).toBe("/entrar");
    expect(screen.queryByRole("button", { name: "Sair" })).toBeNull();
  });

  it.each(["investidor", "empresa", "produtor", "verificador"] as const)(
    "%s ve o botao Sair e nao ve Entrar",
    (role) => {
      render(<SiteHeader role={role} />);

      expect(screen.getByRole("button", { name: "Sair" })).toBeTruthy();
      expect(screen.queryByRole("link", { name: "Entrar" })).toBeNull();
    }
  );

  it("o botao Sair pertence a um form cujo submit chama signOutAction", async () => {
    const { container } = render(<SiteHeader role="investidor" />);
    const form = container.querySelector("form")!;

    expect(form.contains(screen.getByRole("button", { name: "Sair" }))).toBe(true);

    form.requestSubmit();
    await vi.waitFor(() => expect(signOutAction).toHaveBeenCalledTimes(1));
  });
});
