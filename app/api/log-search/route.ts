import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Best-effort analytics logging to search_queries. Uses the anon key — the
// sq_insert RLS policy allows inserts from anyone.
export async function POST(req: Request) {
  try {
    const { userId, rawQuery, parsed, resultsCount } = await req.json();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ ok: false });
    const sb = createClient(url, key);
    await sb.from("search_queries").insert({
      user_id: userId ?? null,
      raw_query: rawQuery,
      parsed_json: parsed ?? null,
      results_count: resultsCount ?? 0,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
