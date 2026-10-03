import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const signOutAction = vi.fn();
vi.mock("@/lib/auth/sign-out", () => ({ signOutAction: (...a: unknown[]) => signOutAction(...a) }));

import { BottomNav } from "../BottomNav";

describe("BottomNav do produtor (AUTH-16)", () => {
  it("mantem Início, Pedidos e Interesses e adiciona o botao Sair", () => {
    render(<BottomNav />);

    expect(screen.getByRole("link", { name: "Início" }).getAttribute("href")).toBe(
      "/produtor/painel"
    );
    expect(screen.getByRole("link", { name: "Pedidos" }).getAttribute("href")).toBe(
      "/produtor/pedidos"
    );
    expect(screen.getByRole("link", { name: "Interesses" }).getAttribute("href")).toBe(
      "/produtor/interesses"
    );
    expect(screen.getByRole("button", { name: "Sair" })).toBeTruthy();
  });

  it("o botao Sair submete o form ligado a signOutAction", async () => {
    const { container } = render(<BottomNav />);
    const form = container.querySelector("form")!;

    expect(form.contains(screen.getByRole("button", { name: "Sair" }))).toBe(true);
    form.requestSubmit();
    await vi.waitFor(() => expect(signOutAction).toHaveBeenCalledTimes(1));
  });
});
