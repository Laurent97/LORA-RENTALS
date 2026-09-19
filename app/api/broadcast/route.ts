import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Number(searchParams.get("limit") ?? 20));

  const { data, error } = await sb
    .from("broadcasts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (String(error.message).includes("broadcasts")) {
      return NextResponse.json({ broadcasts: [], warning: "Run the 20260919_broadcasts migration to enable history." });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ broadcasts: data ?? [] });
}
