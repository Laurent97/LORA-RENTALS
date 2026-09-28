"use client";

import { getSupabase } from "@/lib/supabase/client";
import type { EmailEvent, TriggerResult } from "./triggers";

// Email trigger from client code. Resolves with the server result or null
// when no session/Supabase. Throws only on non-2xx so the caller can log.
export async function notifyEmail(
  event: EmailEvent,
  id: string,
  meta?: Record<string, string | number | boolean | undefined>
): Promise<TriggerResult | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const token = (await sb.auth.getSession()).data.session?.access_token;
  if (!token) return null;

  const res = await fetch("/api/email/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ event, id, meta }),
    keepalive: true,
  });

  const json = (await res.json().catch(() => ({}))) as Partial<TriggerResult> & { error?: string };
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

  return {
    ok: json.ok ?? false,
    sent: json.sent ?? [],
    reason: json.reason,
  };
}
