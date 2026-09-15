import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { id, action } = body as { id?: string; action?: string };
  if (!id || !action) return NextResponse.json({ error: "id and action required" }, { status: 400 });

  let update: Record<string, any> = {};
  if (action === "feature") {
    const { data } = await sb.from("vehicles").select("is_featured").eq("id", id).single();
    update = { is_featured: !(data as any)?.is_featured };
  } else if (action === "redflag") {
    const { data } = await sb.from("vehicles").select("red_flagged_at").eq("id", id).single();
    update = { red_flagged_at: (data as any)?.red_flagged_at ? null : new Date().toISOString() };
  } else {
    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }

  const { error } = await sb.from("vehicles").update(update).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, action });
}

export async function DELETE(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await sb.from("vehicles").update({ deleted_at: new Date().toISOString(), status: "unavailable" }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
