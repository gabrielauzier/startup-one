import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NotificationType } from "../queue";

const insertMock = vi.fn().mockResolvedValue({ error: null });
const getUserByIdMock = vi.fn();

const fromMock = vi.fn((table: string) => {
  if (table === "events") {
    return { insert: insertMock };
  }
  throw new Error(`tabela inesperada no mock: ${table}`);
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: fromMock,
    auth: { admin: { getUserById: getUserByIdMock } },
  })),
}));

const sendEmailMock = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/lib/notifications/send-email", () => ({
  sendEmail: sendEmailMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  insertMock.mockResolvedValue({ error: null });
  sendEmailMock.mockResolvedValue({ ok: true });
  getUserByIdMock.mockResolvedValue({
    data: { user: { email: "destinatario@example.com" } },
    error: null,
  });
});

const ALL_TYPES: NotificationType[] = [
  "cadastro_recebido",
  "ajuste_pedido",
  "selo_concedido",
  "reprovacao",
  "pedido_documento",
  "documento_liberado",
  "interesse_recebido",
  "interesse_aceito",
  "apresentacao_parceiro",
];

describe("enqueueNotification (T53, RF-31/RN-41)", () => {
  it.each(ALL_TYPES)("grava o tipo e o payload corretos para %s", async (type) => {
    const { enqueueNotification } = await import("../queue");
    const payload = { negocioId: "biz-1", extra: type };

    const options =
      type === "apresentacao_parceiro"
        ? { emailTo: "parceiro@example.com" }
        : { destinatarioId: "profile-1" };

    const result = await enqueueNotification({
      type,
      payload,
      email: { subject: "Assunto", body: "Corpo" },
      ...options,
    });

    expect(result.ok).toBe(true);
    expect(insertMock).toHaveBeenCalledTimes(1);
    const rows = insertMock.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.type).toBe(type);
      expect(row.payload).toEqual(payload);
      expect(row.kind).toBe("aviso");
    }
  });

  it("investidor (RN-41 'avisamos você a cada novidade'): dispara e-mail automático e grava 1 linha canal='email'", async () => {
    const { enqueueNotification } = await import("../queue");

    await enqueueNotification({
      type: "interesse_aceito",
      payload: { interesseId: "int-1" },
      destinatarioId: "investor-1",
      email: { subject: "Interesse aceito", body: "..." },
    });

    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "destinatario@example.com" })
    );

    const rows = insertMock.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ canal: "email", destinatario_id: "investor-1" });
    expect(rows[0].enviado_em).not.toBeNull();
  });

  it("produtor (RN-41 WhatsApp manual): NÃO dispara nada automaticamente (só grava a lista pendente), e grava/dispara o e-mail em paralelo", async () => {
    const { enqueueNotification } = await import("../queue");

    await enqueueNotification({
      type: "interesse_recebido",
      payload: { interesseId: "int-2" },
      destinatarioId: "producer-1",
      email: { subject: "Novo interesse", body: "..." },
    });

    const rows = insertMock.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);

    const whatsapp = rows.find((r) => r.canal === "whatsapp_manual");
    const email = rows.find((r) => r.canal === "email");

    expect(whatsapp).toBeDefined();
    expect(whatsapp?.enviado_em).toBeNull();
    expect(whatsapp?.destinatario_id).toBe("producer-1");

    expect(email).toBeDefined();
    expect(email?.enviado_em).not.toBeNull();

    // sendEmail é chamado só 1x (pelo e-mail) - nunca há um "envio" de
    // WhatsApp automático, apenas o registro na fila manual.
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it("apresentacao_parceiro: envia e-mail ao destinatário explícito (parceiro), sem destinatario_id de profile", async () => {
    const { enqueueNotification } = await import("../queue");

    await enqueueNotification({
      type: "apresentacao_parceiro",
      payload: { interesseId: "int-3" },
      emailTo: "parceiro@example.com",
      email: { subject: "Apresentação", body: "..." },
    });

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "parceiro@example.com" })
    );
    expect(getUserByIdMock).not.toHaveBeenCalled();

    const rows = insertMock.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    expect(rows[0].destinatario_id).toBeNull();
  });

  it("quando o e-mail do destinatário não é resolvido, grava enviado_em null e não chama sendEmail", async () => {
    getUserByIdMock.mockResolvedValueOnce({ data: { user: null }, error: null });
    const { enqueueNotification } = await import("../queue");

    await enqueueNotification({
      type: "documento_liberado",
      payload: {},
      destinatarioId: "investor-sem-email",
      email: { subject: "s", body: "b" },
    });

    expect(sendEmailMock).not.toHaveBeenCalled();
    const rows = insertMock.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(rows[0].enviado_em).toBeNull();
  });
});
