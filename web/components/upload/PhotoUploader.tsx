"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  /** URL local (via `URL.createObjectURL`) só pra miniatura - nunca enviada ao servidor. */
  previewUrl?: string;
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
 *
 * Gap de design (PRO-05): o protótipo separa "Tirar foto" (abre a
 * câmera) de "Escolher arquivo" (galeria/arquivos), com miniatura e
 * estado "Enviado · N fotos" em vez do `<input type=file>` nativo cru.
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoga as URLs de preview ao desmontar, pra nao vazar memoria.
  useEffect(() => {
    return () => {
      for (const item of queue) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      setQueue((q) => [...q, { id, fileName: file.name, status: "pending", previewUrl }]);
      setQueue((q) => q.map((it) => (it.id === id ? { ...it, status: "uploading" } : it)));
      void uploadFile(file, id);
    }
  }

  const hasUploaded = uploadedCount > 0;
  // Evita disparar varias tentativas em paralelo (ex.: usuario clicando
  // de novo enquanto uma falha de rede ja esta em andamento) - cada
  // envio malsucedido ainda fica visivel na fila, com a mensagem de
  // erro, mas sem empilhar requisicoes novas por cima.
  const isUploading = queue.some((item) => item.status === "uploading");

  return (
    <div className="flex flex-col gap-2">
      <p className={"font-body text-sm font-medium " + (highlight ? "text-destructive" : "")}>
        {label}
        {required ? "" : " (opcional)"}
      </p>

      <Card
        className={
          "gap-2 p-3 " +
          (hasUploaded
            ? "border-primary/30"
            : "border-dashed " + (highlight ? "border-destructive" : "border-border"))
        }
      >
        {hasUploaded && (
          <div className="flex items-center justify-between gap-2">
            <p className="font-body text-sm font-medium text-primary">
              Enviado · {uploadedCount} {itemLabel}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Trocar
            </Button>
          </div>
        )}

        {!hasUploaded && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isUploading}
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="size-4" aria-hidden /> Tirar foto
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" aria-hidden /> Escolher arquivo
            </Button>
          </div>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,application/pdf"
          capture="environment"
          aria-label={label}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/heic,application/pdf"
          multiple
          aria-label={label}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {queue.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {queue.map((item) => (
              <li key={item.id} className="flex items-center gap-2 font-body text-xs text-foreground/70">
                {item.previewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="size-8 rounded object-cover"
                  />
                )}
                <span>
                  {item.fileName} —{" "}
                  {item.status === "uploading" && "Enviando..."}
                  {item.status === "done" && "Enviado"}
                  {item.status === "error" && (
                    <span className="text-destructive">{item.error ?? "Falha no envio"}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {highlight && (
        <p className="font-body text-sm text-destructive">
          Envie ao menos 1 foto para continuar.
        </p>
      )}
    </div>
  );
}
