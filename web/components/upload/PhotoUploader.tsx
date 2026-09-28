"use client";

import { useCallback, useRef, useState } from "react";
import { compressImage } from "@/lib/upload/compress";
import { validateEvidenceFile } from "@/lib/upload/validate";
import {
  confirmEvidence,
  createUploadUrl,
} from "@/app/(producer)/produtor/cadastro/4/actions";

type QueueStatus = "pending" | "uploading" | "done" | "error";

interface QueueItem {
  id: string;
  fileName: string;
  status: QueueStatus;
  error?: string;
}

export interface CreateUploadUrlFn {
  (businessId: string, grupo: string, fileName: string): Promise<{
    ok: boolean;
    error?: string;
    path?: string;
    signedUrl?: string;
  }>;
}

export interface ConfirmUploadFn {
  (
    businessId: string,
    grupo: string,
    path: string,
    mime: string,
    tamanho: number
  ): Promise<{ ok: boolean; error?: string }>;
}

export interface PhotoUploaderProps {
  businessId: string;
  grupo: string;
  label: string;
  required?: boolean;
  highlight?: boolean;
  initialCount?: number;
  onUploaded?: () => void;
  /** Rótulo do arquivo enviado no resumo (ex.: "fotos", "documentos"). Padrão: "fotos". */
  itemLabel?: string;
  /**
   * T44 (RF-25): permite reaproveitar este componente para enviar
   * documentos adicionais (laudo, certificado completo) para a tabela
   * `documents`, em vez das fotos de cadastro (`evidences`, T09) - por
   * padrão usa `createUploadUrl`/`confirmEvidence` de
   * cadastro/4/actions.ts (comportamento original, inalterado).
   */
  createUploadUrlFn?: CreateUploadUrlFn;
  confirmUploadFn?: ConfirmUploadFn;
}

/**
 * RF-09/RN-08/RN-09: upload de fotos/documentos por câmera ou arquivo,
 * com compressão client-side (RN-09) e fila de retomada simples - um
 * item que falha (ex.: sem conexão) fica marcado como erro e pode ser
 * reenviado sem duplicar (CA-09.2), reenviando o mesmo item da fila em
 * vez de criar um novo.
 */
export function PhotoUploader({
  businessId,
  grupo,
  label,
  required,
  highlight,
  initialCount = 0,
  onUploaded,
  itemLabel = "fotos",
  createUploadUrlFn = createUploadUrl as CreateUploadUrlFn,
  confirmUploadFn = confirmEvidence as ConfirmUploadFn,
}: PhotoUploaderProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploadedCount, setUploadedCount] = useState(initialCount);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File, itemId: string) => {
      const validation = validateEvidenceFile(file);
      if (!validation.ok) {
        setQueue((q) =>
          q.map((it) => (it.id === itemId ? { ...it, status: "error", error: validation.error } : it))
        );
        return;
      }

      try {
        let uploadBlob: Blob = file;
        let mime = file.type;

        if (file.type.startsWith("image/")) {
          const compressed = await compressImage(file);
          uploadBlob = compressed.blob;
          mime = uploadBlob.type || file.type;
        }

        const created = await createUploadUrlFn(businessId, grupo, file.name);
        if (!created.ok || !created.signedUrl || !created.path) {
          throw new Error(created.error ?? "Falha ao preparar o envio.");
        }

        const putRes = await fetch(created.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": mime },
          body: uploadBlob,
        });
        if (!putRes.ok) {
          throw new Error("Falha no envio. Tente de novo quando a conexão voltar.");
        }

        const confirmed = await confirmUploadFn(
          businessId,
          grupo,
          created.path,
          mime,
          uploadBlob.size
        );
        if (!confirmed.ok) {
          throw new Error(confirmed.error ?? "Falha ao confirmar o envio.");
        }

        setQueue((q) => q.map((it) => (it.id === itemId ? { ...it, status: "done" } : it)));
        setUploadedCount((c) => c + 1);
        onUploaded?.();
      } catch (err) {
        setQueue((q) =>
          q.map((it) =>
            it.id === itemId
              ? { ...it, status: "error", error: err instanceof Error ? err.message : "Falha no envio." }
              : it
          )
        );
      }
    },
    [businessId, grupo, onUploaded, createUploadUrlFn, confirmUploadFn]
  );

  function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      const id = `${Date.now()}-${file.name}-${Math.random()}`;
      setQueue((q) => [...q, { id, fileName: file.name, status: "pending" }]);
      setQueue((q) => q.map((it) => (it.id === id ? { ...it, status: "uploading" } : it)));
      void uploadFile(file, id);
    }
  }


  return (
    <div className="flex flex-col gap-2">
      <p className={"font-body text-sm font-medium " + (highlight ? "text-destructive" : "")}>
        {label}
        {required ? "" : " (opcional)"}
      </p>

      {uploadedCount > 0 && (
        <p className="font-body text-sm text-primary">
          Enviado · {uploadedCount} {itemLabel}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,application/pdf"
        multiple
        capture="environment"
        aria-label={label}
        onChange={(e) => handleFiles(e.target.files)}
        className="font-body text-sm"
      />

      <ul className="flex flex-col gap-1">
        {queue.map((item) => (
          <li key={item.id} className="font-body text-xs text-foreground/70">
            {item.fileName} —{" "}
            {item.status === "uploading" && "Enviando..."}
            {item.status === "done" && "Enviado"}
            {item.status === "error" && (
              <span className="text-destructive">{item.error ?? "Falha no envio"}</span>
            )}
          </li>
        ))}
      </ul>

      {highlight && (
        <p className="font-body text-sm text-destructive">
          Envie ao menos 1 foto para continuar.
        </p>
      )}
    </div>
  );
}
