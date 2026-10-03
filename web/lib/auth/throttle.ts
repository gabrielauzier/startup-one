import { createAdminClient } from "@/lib/supabase/admin";
import { hashEmail } from "./email";

export type ThrottleKind = "signup" | "magic" | "reset";

export const COOLDOWN_SECONDS = 60;
export const MAX_SENDS_PER_HOUR = 3;
const HOUR_MS = 60 * 60 * 1000;

export type ThrottleResult =
  | { allowed: true }
  | { allowed: false; reason: "cooldown" | "hourly-cap"; retryAfterSec: number };

/**
 * AUTH-09 / AD-010: cooldown de 60 s e teto de 3 envios/hora por e-mail e
 * tipo. Conta tambem e-mail sem conta (a chave e' so' o hash do e-mail),
 * entao nao revela se a conta existe. Grava a tentativa quando permite.
 */
export async function checkAndRecordSend(
  email: string,
  kind: ThrottleKind
): Promise<ThrottleResult> {
  const admin = createAdminClient();
  const keyHash = hashEmail(email);
  const now = Date.now();
  const since = new Date(now - HOUR_MS).toISOString();

  const { data } = await admin
    .from("auth_throttle")
    .select("created_at")
    .eq("key_hash", keyHash)
    .eq("kind", kind)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const sends = (data ?? []).map((row) => new Date(row.created_at as string).getTime());

  if (sends.length >= MAX_SENDS_PER_HOUR) {
    const oldestInWindow = sends[MAX_SENDS_PER_HOUR - 1];
    return {
      allowed: false,
      reason: "hourly-cap",
      retryAfterSec: Math.max(1, Math.ceil((oldestInWindow + HOUR_MS - now) / 1000)),
    };
  }

  if (sends.length > 0) {
    const elapsedSec = (now - sends[0]) / 1000;
    if (elapsedSec < COOLDOWN_SECONDS) {
      return {
        allowed: false,
        reason: "cooldown",
        retryAfterSec: Math.max(1, Math.ceil(COOLDOWN_SECONDS - elapsedSec)),
      };
    }
  }

  await admin.from("auth_throttle").insert({ key_hash: keyHash, kind });
  await admin.from("auth_throttle").delete().lt("created_at", since);

  return { allowed: true };
}
