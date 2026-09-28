"use client";

import { useState } from "react";
import { PhotoUploader } from "@/components/upload/PhotoUploader";
import { createDocumentUploadUrl, confirmDocumentUpload } from "./actions";

export function DocumentosAdicionaisForm({
  businessId,
  hasLaudo,
  hasCertificado,
}: {
  businessId: string;
  hasLaudo: boolean;
  hasCertificado: boolean;
}) {
  const [laudoEnviado, setLaudoEnviado] = useState(hasLaudo);
  const [certificadoEnviado, setCertificadoEnviado] = useState(hasCertificado);

  return (
    <div className="flex flex-col gap-6">
      <PhotoUploader
        businessId={businessId}
        grupo="laudo"
        label="Laudo ambiental"
        itemLabel="documentos"
        initialCount={hasLaudo ? 1 : 0}
        createUploadUrlFn={createDocumentUploadUrl}
        confirmUploadFn={confirmDocumentUpload}
        onUploaded={() => setLaudoEnviado(true)}
      />
      {laudoEnviado && (
        <p className="font-body text-xs text-primary">
          Laudo ambiental enviado - aparece na aba Documentos como &quot;Precisa de
          liberação&quot;.
        </p>
      )}

      <PhotoUploader
        businessId={businessId}
        grupo="certificado_completo"
        label="Certificado completo"
        itemLabel="documentos"
        initialCount={hasCertificado ? 1 : 0}
        createUploadUrlFn={createDocumentUploadUrl}
        confirmUploadFn={confirmDocumentUpload}
        onUploaded={() => setCertificadoEnviado(true)}
      />
      {certificadoEnviado && (
        <p className="font-body text-xs text-primary">
          Certificado completo enviado - aparece na aba Documentos como &quot;Precisa de
          liberação&quot;.
        </p>
      )}
    </div>
  );
}
