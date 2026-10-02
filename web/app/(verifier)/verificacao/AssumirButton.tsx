"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { assignToMe } from "./actions";

export function AssumirButton({ businessId }: { businessId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await assignToMe(businessId);
            if (!result.ok) {
              setError(result.error ?? "Não foi possível assumir.");
              return;
            }
            setError(null);
            router.push(`/verificacao/${businessId}`);
          })
        }
      >
        Assumir
      </Button>
      {error && <p className="font-body text-xs text-destructive">{error}</p>}
    </div>
  );
}
