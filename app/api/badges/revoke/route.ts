import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { badgeId?: string; reason?: string };
  const { badgeId, reason } = body;
  if (!badgeId) return NextResponse.json({ error: "badgeId required" }, { status: 400 });

  const { error } = await sb
    .from("driver_badges")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by: caller.id,
      revoke_reason: reason || null,
    })
    .eq("id", badgeId)
    .neq("status", "revoked");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
