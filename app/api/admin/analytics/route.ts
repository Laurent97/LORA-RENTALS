import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import type { AnalyticsSummary } from "@/types";

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (caller.role !== "admin") return NextResponse.json({ error: "admin only" }, { status: 403 });

  const { data, error } = await sb.rpc("get_analytics_summary");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const summary = data as unknown as AnalyticsSummary;
  await sb.from("analytics_snapshots").insert({ snapshot: summary });
  return NextResponse.json(summary);
}
