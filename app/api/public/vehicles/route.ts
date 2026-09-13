import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { vehicleFromRow } from "@/lib/supabase/mappers";

// GET /api/public/vehicles — developer API for live fleet inventory.
// Requires a valid `x-api-key` header.
export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return NextResponse.json({ error: "x-api-key header required" }, { status: 401 });

  const { data: keyRow } = await sb.from("api_keys").select("*").eq("key", apiKey).single();
  if (!keyRow) return NextResponse.json({ error: "invalid api key" }, { status: 401 });

  await sb.from("api_keys").update({ last_used: new Date().toISOString() }).eq("id", keyRow.id);

  const limit = Math.min(100, Number(new URL(req.url).searchParams.get("limit") ?? 20));
  const country = new URL(req.url).searchParams.get("country");

  let query = sb.from("vehicles").select("*").eq("status", "available").order("created_at", { ascending: false }).limit(limit);
  if (country) query = query.eq("country", country);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    meta: { count: (data ?? []).length, country: country ?? "all" },
    data: (data ?? []).map(vehicleFromRow),
  });
}
