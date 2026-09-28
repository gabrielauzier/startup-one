import { describe, it, expect } from "vitest";
import { canAssign } from "../assignment";

describe("canAssign (RN-17/CA-17.1)", () => {
  const now = new Date("2026-09-28T12:00:00Z");

  it("permite quando ninguem esta com o item", () => {
    expect(canAssign({ assignedTo: null, assignedAt: null }, "verificador-b", now)).toBe(
      true
    );
  });

  it("permite quando o proprio verificador ja e' o dono da posse", () => {
    const state = {
      assignedTo: "verificador-a",
      assignedAt: new Date("2026-09-28T11:00:00Z").toISOString(),
    };
    expect(canAssign(state, "verificador-a", now)).toBe(true);
  });

  it("bloqueia outro verificador enquanto a trava de 24h esta ativa (CA-17.1)", () => {
    const state = {
      assignedTo: "verificador-a",
      assignedAt: new Date("2026-09-28T11:00:00Z").toISOString(), // 1h atras
    };
    expect(canAssign(state, "verificador-b", now)).toBe(false);
  });

  it("libera outro verificador apos 24h", () => {
    const state = {
      assignedTo: "verificador-a",
      assignedAt: new Date("2026-09-27T11:00:00Z").toISOString(), // 25h atras
    };
    expect(canAssign(state, "verificador-b", now)).toBe(true);
  });

  it("bloqueia exatamente 1 minuto antes de completar 24h", () => {
    const state = {
      assignedTo: "verificador-a",
      assignedAt: new Date("2026-09-27T12:01:00Z").toISOString(), // 23h59
    };
    expect(canAssign(state, "verificador-b", now)).toBe(false);
  });
});
