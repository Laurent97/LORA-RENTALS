import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Server routes only (app/api/**). Never
// import from client components: SUPABASE_SERVICE_ROLE_KEY is not NEXT_PUBLIC_.
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) {
    try {
      client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      if (!client || !client.auth) {
        console.error("[getSupabaseAdmin] created client is missing auth");
        client = null;
        return null;
      }
    } catch (err) {
      console.error("[getSupabaseAdmin] failed to create client:", err);
      return null;
    }
  }
  return client;
}

// Resolve the caller from a Bearer token and return their profile row.
export async function getCallerProfile(authHeader: string | null): Promise<{ id: string; role: string; email: string } | null> {
  const sb = getSupabaseAdmin();
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!sb || !token) return null;
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: profile } = await sb.from("users").select("id, role, email").eq("id", data.user.id).single();
  return profile ?? null;
}
