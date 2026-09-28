"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CHECKLIST_ITEMS,
  emptyChecklist,
  isChecklistComplete,
  isValidMotivo,
  type ChecklistKey,
} from "@/lib/verification/checklist";
import { requestAdjustment, reject, approve } from "./actions";

const CHECKLIST_LABEL: Record<ChecklistKey, string> = {
  cnpj_ativo: "CNPJ ativo e compatível com o nome",
  documento_terra_legivel: "Documento da terra legível e compatível com a cidade",
  fotos_compativeis: "Fotos compatíveis com os produtos",
  producao_coerente: "Produção mensal coerente",
  praticas_plausiveis: "Práticas declaradas plausíveis",
};

interface Certification {
  id: string;
  certificadora: string;
  conferido: boolean;
}

export function AnaliseForm({
  businessId,
  hasTerraEvidence,
  certifications,
}: {
  businessId: string;
  hasTerraEvidence: boolean;
  certifications: Certification[];
}) {
  const [checklist, setChecklist] = useState(emptyChecklist());
  const [motivo, setMotivo] = useState("");
  const [mode, setMode] = useState<"aprovar" | "ajuste" | "reprovar" | null>(null);
  const [notas, setNotas] = useState({ a: "", s: "", g: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const checklistComplete = isChecklistComplete(checklist);
  const canApprove = checklistComplete && hasTerraEvidence;
  const motivoValid = isValidMotivo(motivo);

  function toggle(key: ChecklistKey) {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function submitAjuste() {
    startTransition(async () => {
      const result = await requestAdjustment(businessId, motivo, checklist, []);
      if (!result.ok) setError(result.error ?? "Erro ao registrar.");
    });
  }

  function submitReprovar() {
    startTransition(async () => {
      const result = await reject(businessId, motivo, checklist);
      if (!result.ok) setError(result.error ?? "Erro ao registrar.");
    });
  }

  function submitAprovar() {
    const notaA = Number(notas.a);
    const notaS = Number(notas.s);
    const notaG = Number(notas.g);
    startTransition(async () => {
      const result = await approve({ businessId, checklist, notaA, notaS, notaG });
      if (!result.ok) setError(result.error ?? "Erro ao registrar.");
    });
  }

  return (
    <section className="flex flex-col gap-6 rounded-md border border-border p-4">
      <div>
        <h2 className="font-heading text-lg text-primary">Checklist (RN-18)</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {CHECKLIST_ITEMS.map((key) => (
            <li key={key} className="flex items-center gap-2">
              <Checkbox
                id={`checklist-${key}`}
                checked={checklist[key]}
                onCheckedChange={() => toggle(key)}
                data-testid={`checklist-${key}`}
              />
              <label htmlFor={`checklist-${key}`} className="font-body text-sm">
                {CHECKLIST_LABEL[key]}
              </label>
            </li>
          ))}
        </ul>
      </div>

      {certifications.length > 0 && (
        <div>
          <h2 className="font-heading text-lg text-primary">Selos de certificadora</h2>
          <p className="font-body text-sm text-foreground/70">
            Confira cada selo antes de aprovar — só selos conferidos aparecem
            publicamente (RN-20).
          </p>
        </div>
      )}

      {!hasTerraEvidence && (
        <p
          data-testid="aviso-sem-terra"
          className="rounded-md bg-muted px-3 py-2 font-body text-sm text-foreground/80"
        >
          Sem documento da terra enviado — só é possível pedir ajuste (CA-08.2).
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setMode("ajuste")}
          aria-pressed={mode === "ajuste"}
        >
          Pedir ajuste
        </Button>
        {hasTerraEvidence && (
          <>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setMode("reprovar")}
              aria-pressed={mode === "reprovar"}
            >
              Reprovar
            </Button>
            <Button
              type="button"
              onClick={() => setMode("aprovar")}
              disabled={!canApprove}
              aria-pressed={mode === "aprovar"}
              data-testid="botao-aprovar"
            >
              Aprovar
            </Button>
          </>
        )}
      </div>

      {(mode === "ajuste" || mode === "reprovar") && (
        <div className="flex flex-col gap-2">
          <label htmlFor="motivo" className="font-body text-sm font-medium">
            Motivo (mínimo 20 caracteres)
          </label>
          <textarea
            id="motivo"
            data-testid="motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            className="rounded-md border border-border bg-background px-3 py-2 font-body text-sm"
          />
          <Button
            type="button"
            disabled={!motivoValid || pending}
            onClick={mode === "ajuste" ? submitAjuste : submitReprovar}
            data-testid="confirmar-decisao"
          >
            {mode === "ajuste" ? "Confirmar pedido de ajuste" : "Confirmar reprovação"}
          </Button>
        </div>
      )}

      {mode === "aprovar" && canApprove && (
        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-base text-primary">
            Notas Îasy (0 a 100, inteiras)
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1 font-body text-sm">
              Ambiental
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={notas.a}
                onChange={(e) => setNotas((prev) => ({ ...prev, a: e.target.value }))}
                className="rounded-md border border-border bg-background px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1 font-body text-sm">
              Social
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={notas.s}
                onChange={(e) => setNotas((prev) => ({ ...prev, s: e.target.value }))}
                className="rounded-md border border-border bg-background px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1 font-body text-sm">
              Gestão
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={notas.g}
                onChange={(e) => setNotas((prev) => ({ ...prev, g: e.target.value }))}
                className="rounded-md border border-border bg-background px-2 py-1"
              />
            </label>
          </div>
          <Button
            type="button"
            disabled={pending}
            onClick={submitAprovar}
            data-testid="confirmar-aprovacao"
          >
            Confirmar aprovação
          </Button>
        </div>
      )}

      {error && <p className="font-body text-sm text-destructive">{error}</p>}
    </section>
  );
}
