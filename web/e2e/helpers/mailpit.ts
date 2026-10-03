const MAILPIT_URL = "http://127.0.0.1:54324";

export interface MailpitMessage {
  ID: string;
  Subject: string;
  Text: string;
  HTML: string;
}

/**
 * Espera chegar uma mensagem para `to` (opcionalmente filtrando por
 * assunto) criada depois de `after`, e devolve a mais recente. Usa a
 * API do Mailpit local.
 */
export async function waitForMail(
  to: string,
  opts: { subject?: string; after?: number; attempts?: number } = {}
): Promise<MailpitMessage> {
  const { subject, after = 0, attempts = 30 } = opts;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const res = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`
    );
    const { messages } = (await res.json()) as {
      messages: { ID: string; Subject: string; Created: string }[];
    };

    const match = messages
      .filter((m) => new Date(m.Created).getTime() >= after)
      .filter((m) => !subject || m.Subject.includes(subject))
      .sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime())[0];

    if (match) {
      const detail = await fetch(`${MAILPIT_URL}/api/v1/message/${match.ID}`);
      return (await detail.json()) as MailpitMessage;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Nenhum e-mail para ${to}${subject ? ` com assunto "${subject}"` : ""} no Mailpit`);
}

/** Quantos e-mails existem para `to` criados depois de `after`. */
export async function countMails(to: string, after = 0): Promise<number> {
  const res = await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`);
  const { messages } = (await res.json()) as { messages: { Created: string }[] };
  return messages.filter((m) => new Date(m.Created).getTime() >= after).length;
}

/** Primeiro link (href) do HTML do e-mail que contem `contains`. */
export function extractLink(html: string, contains: string): string {
  const match = [...html.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1].replace(/&amp;/g, "&"))
    .find((href) => href.includes(contains));
  if (!match) throw new Error(`Nenhum link com "${contains}" no e-mail`);
  return match;
}
