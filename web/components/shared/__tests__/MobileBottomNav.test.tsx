import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/auth/sign-out", () => ({ signOutAction: vi.fn() }));

import { MobileBottomNav } from "../MobileBottomNav";

describe("MobileBottomNav (AUTH-16)", () => {
  it("com papel mostra o item Sair com alvo de toque minimo de 44px (min-h-11/min-w-11)", () => {
    render(<MobileBottomNav role="investidor" />);

    const sair = screen.getByRole("button", { name: "Sair" });
    expect(sair.className).toContain("min-h-11");
    expect(sair.className).toContain("min-w-11");
  });

  it("sem papel nao mostra Sair", () => {
    render(<MobileBottomNav role={null} />);

    expect(screen.queryByRole("button", { name: "Sair" })).toBeNull();
  });
});
