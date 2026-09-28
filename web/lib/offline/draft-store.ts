import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "iasy-cadastro-draft";
const STORE_NAME = "drafts";
const DB_VERSION = 1;

export interface DraftSnapshot {
  businessId: string;
  parts: Record<number, unknown>;
  dirty: boolean;
  updatedAt: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "businessId" });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * RN-07: salva uma parte do cadastro no aparelho. Cada chamada mescla os
 * dados da parte no rascunho existente e marca `dirty` para a proxima
 * sincronizacao (CA-07.1).
 */
export async function saveLocalDraft(
  businessId: string,
  part: number,
  data: unknown
): Promise<void> {
  const db = await getDb();
  const existing = (await db.get(STORE_NAME, businessId)) as
    | DraftSnapshot
    | undefined;

  const snapshot: DraftSnapshot = {
    businessId,
    parts: { ...(existing?.parts ?? {}), [part]: data },
    dirty: true,
    updatedAt: new Date().toISOString(),
  };

  await db.put(STORE_NAME, snapshot);
}

/**
 * Le o rascunho salvo no aparelho, ou `null` se nao houver nenhum ainda.
 */
export async function getLocalDraft(
  businessId: string
): Promise<DraftSnapshot | null> {
  const db = await getDb();
  const snapshot = (await db.get(STORE_NAME, businessId)) as
    | DraftSnapshot
    | undefined;
  return snapshot ?? null;
}

/**
 * RN-07/CA-07.2: quando a conexao volta, envia o rascunho pendente sem
 * acao do usuario. So' chama `sync` se estiver online e houver algo
 * pendente (`dirty`) - repetir a chamada sem mudancas nao reenvia nada,
 * o que evita duplicar o envio (mesmo espirito de RN-09 para fotos).
 */
export async function flushWhenOnline(
  businessId: string,
  sync: (snapshot: DraftSnapshot) => Promise<void>
): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return;
  }

  const db = await getDb();
  const snapshot = (await db.get(STORE_NAME, businessId)) as
    | DraftSnapshot
    | undefined;

  if (!snapshot || !snapshot.dirty) {
    return;
  }

  await sync(snapshot);

  await db.put(STORE_NAME, { ...snapshot, dirty: false });
}
