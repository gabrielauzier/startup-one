/**
 * RN-32, RN-33, CA-32.1, CA-32.3, CA-33.1: calcula a situação de um
 * documento para um investidor específico, combinando o documento
 * (`aberto_a_todos`) com o pedido mais recente dele (`document_requests`,
 * se existir).
 *
 * A expiração de 7 dias de um pedido `pendente` (RN-32) e de 30 dias
 * de um acesso `liberado` (RN-33/CA-33.1) é calculada aqui na leitura,
 * não só esperada de um `status` já atualizado no banco - o cron que
 * viraria `pendente`/`liberado` para `expirado` de verdade é do T53
 * (fora deste lote), então um pedido/acesso "logicamente" vencido mas
 * ainda com o `status` antigo no banco precisa ser tratado como
 * vencido aqui, senão a tela mostraria um estado errado até o cron
 * rodar.
 */

export type DocumentRequestStatus = "pendente" | "liberado" | "recusado" | "expirado" | "retirado";

export interface DocumentRequestSnapshot {
  status: DocumentRequestStatus;
  createdAt: string;
  expiraEm: string | null;
}

export type DocumentSituation =
  | { kind: "aberto_a_todos" }
  | { kind: "precisa_liberacao" }
  | { kind: "pedido_enviado" }
  | { kind: "liberado" }
  | { kind: "acesso_expirado" }
  | { kind: "nao_liberado" };

const PEDIDO_EXPIRA_DIAS = 7;
const ACESSO_EXPIRA_DIAS = 30;

export const SITUATION_LABELS: Record<DocumentSituation["kind"], string> = {
  aberto_a_todos: "Aberto a todos",
  precisa_liberacao: "Precisa de liberação",
  pedido_enviado: "Pedido enviado",
  liberado: "Liberado para você",
  acesso_expirado: "Acesso expirado, solicite novamente",
  nao_liberado: "Não liberado",
};

function daysBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
}

/**
 * CA-32.1: logo após o pedido, a situação vira "Pedido enviado" e o
 * botão "Solicitar acesso" some. CA-33.1: acesso liberado há mais de
 * 30 dias mostra "Acesso expirado, solicite novamente". CA-32.3:
 * pedido recusado mostra "Não liberado" (o texto exato "A produtora
 * optou por não liberar" fica na UI, não nesta função).
 */
export function computeDocumentSituation(
  abertoATodos: boolean,
  latestRequest: DocumentRequestSnapshot | null,
  now: Date = new Date()
): DocumentSituation {
  if (abertoATodos) {
    return { kind: "aberto_a_todos" };
  }

  if (!latestRequest) {
    return { kind: "precisa_liberacao" };
  }

  switch (latestRequest.status) {
    case "pendente": {
      const idade = daysBetween(new Date(latestRequest.createdAt), now);
      if (idade >= PEDIDO_EXPIRA_DIAS) {
        // RN-32: sem resposta em 7 dias, o pedido expira e pode ser refeito.
        return { kind: "precisa_liberacao" };
      }
      return { kind: "pedido_enviado" };
    }
    case "liberado": {
      const referencia = latestRequest.expiraEm
        ? new Date(latestRequest.expiraEm)
        : new Date(new Date(latestRequest.createdAt).getTime() + ACESSO_EXPIRA_DIAS * 86_400_000);
      if (now >= referencia) {
        return { kind: "acesso_expirado" };
      }
      return { kind: "liberado" };
    }
    case "expirado":
      // Pedido já expirado (cron do T53 já rodou, ou nunca chegou a
      // ser respondido) - pode ser refeito.
      return { kind: "precisa_liberacao" };
    case "recusado":
    case "retirado":
      return { kind: "nao_liberado" };
    default:
      return { kind: "precisa_liberacao" };
  }
}

/** CA-32.1/CA-33.1: só faz sentido oferecer "Solicitar acesso" nestas situações. */
export function canRequestAccess(situation: DocumentSituation): boolean {
  return situation.kind === "precisa_liberacao" || situation.kind === "acesso_expirado";
}
