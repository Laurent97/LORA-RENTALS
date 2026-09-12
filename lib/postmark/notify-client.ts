"use client";

import { getSupabase } from "@/lib/supabase/client";
import type { EmailEvent } from "./triggers";

// Fire-and-forget email trigger from client code. Never throws, never blocks UX.
// Silently no-ops in mock mode (no Supabase) or when signed out — the server
// loads all data itself, so only the event + entity id are sent.
export async function notifyEmail(event: EmailEvent, id: string, meta?: Record<string, string | number | boolean | undefined>): Promise<void> {
  try {
    const sb = getSupabase();
    if (!sb) return;
    const token = (await sb.auth.getSession()).data.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/email/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ event, id, meta }),
      keepalive: true,
    });
    if (!res.ok && process.env.NODE_ENV !== "production") {
      console.warn(`[email] notify ${event} → ${res.status}`, await res.text().catch(() => ""));
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "production") console.warn("[email] notify failed", err);
  }
}
