"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser client — anon key, session persisted in localStorage.
// Returns null when env vars are absent so the app falls back to mock data.

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  if (!client) {
    try {
      client = createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true },
      });
      if (!client || !client.auth) {
        console.error("[getSupabase] created client is missing auth");
        client = null;
        return null;
      }
    } catch (err) {
      console.error("[getSupabase] failed to create client:", err);
      return null;
    }
  }
  return client;
}
