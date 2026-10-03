"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import { Typography } from "@/components/ui/typography";

const STORAGE_KEY = "iasy_set_password_notice_dismissed";

function wasDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => void listeners.delete(listener);
};

/**
 * AUTH-18: conta do MVP (sem senha) que entra por link ve, uma vez por
 * sessao do navegador, o convite para definir uma senha. O estado vem do
 * `sessionStorage` (lido so' no cliente: o servidor sempre renderiza como
 * "nao dispensado", sem divergencia de hidratacao).
 */
export function SetPasswordNotice() {
  const storedDismissed = useSyncExternalStore(subscribe, wasDismissed, () => false);
  // Sem sessionStorage (modo privado restrito) o aviso some so' nesta renderizacao.
  const [localDismissed, setLocalDismissed] = useState(false);

  if (storedDismissed || localDismissed) return null;

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ver `localDismissed`
    }
    setLocalDismissed(true);
    listeners.forEach((listener) => listener());
  };

  return (
    <div
      role="region"
      aria-label="Defina uma senha"
      className="flex items-center justify-between gap-4 border-b border-border bg-banner px-6 py-3"
    >
      <Typography variant="body" size="sm">
        Defina uma senha para entrar mais rápido.{" "}
        <Link href="/redefinir-senha" className="text-primary underline underline-offset-4">
          Definir senha
        </Link>
      </Typography>
      <button type="button" aria-label="Dispensar aviso de senha" onClick={dismiss} className="min-h-11 min-w-11">
        <X className="mx-auto size-4" aria-hidden />
      </button>
    </div>
  );
}
