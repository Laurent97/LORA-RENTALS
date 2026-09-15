import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data, error } = await sb
    .from("driver_badges")
    .select(
      "*, driver:drivers!driver_id(id, full_name, photo_url, license_number, languages), owner:users!owner_id(id, name, email)"
    )
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ badges: data ?? [] });
}
