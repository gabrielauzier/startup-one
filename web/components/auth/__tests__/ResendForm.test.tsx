import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { ResendForm, type ResendState } from "../ResendForm";

beforeEach(() => vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "Date"] }));
afterEach(() => vi.useRealTimers());

const noop = async (): Promise<ResendState> => ({});

describe("ResendForm (AUTH-09)", () => {
  it("comeca bloqueado com a contagem de 60 s visivel", () => {
    render(<ResendForm action={noop} label="Reenviar" sentText="Enviamos outro link." />);

    const button = screen.getByRole("button", { name: "Reenviar (60 s)" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });

  it("a contagem diminui a cada segundo e libera o botao ao zerar", () => {
    render(<ResendForm action={noop} label="Reenviar" sentText="x" initialCooldown={3} />);

    act(() => void vi.advanceTimersByTime(1000));
    expect(screen.getByRole("button", { name: "Reenviar (2 s)" })).toBeTruthy();

    act(() => void vi.advanceTimersByTime(2000));
    const button = screen.getByRole("button", { name: "Reenviar" }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it("depois de reenviar mostra a confirmacao e reinicia o cooldown com o valor da action", async () => {
    vi.useRealTimers();
    const action = vi.fn(async (): Promise<ResendState> => ({ sent: true, retryAfterSec: 60 }));
    render(<ResendForm action={action} label="Reenviar" sentText="Enviamos outro link." initialCooldown={0} />);

    fireEvent.click(screen.getByRole("button", { name: "Reenviar" }));

    expect(await screen.findByText("Enviamos outro link.", {}, { timeout: 3000 })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reenviar (60 s)" })).toBeTruthy();
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("erro da action aparece em role=alert e a espera devolvida bloqueia o botao", async () => {
    vi.useRealTimers();
    const action = async (): Promise<ResendState> => ({
      error: "Aguarde 40 s para pedir de novo.",
      retryAfterSec: 40,
    });
    render(<ResendForm action={action} label="Reenviar" sentText="x" initialCooldown={0} />);

    fireEvent.click(screen.getByRole("button", { name: "Reenviar" }));

    expect(
      (await screen.findByRole("alert", {}, { timeout: 3000 })).textContent
    ).toBe("Aguarde 40 s para pedir de novo.");
    expect(screen.getByRole("button", { name: "Reenviar (40 s)" })).toBeTruthy();
  });
});
