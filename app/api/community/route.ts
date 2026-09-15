import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const { data } = await sb.from("car_sharing_circles").select("*, owner:owner_id(name)").eq("status", "active").order("created_at", { ascending: false });
  return NextResponse.json({ circles: data ?? [] });
}
