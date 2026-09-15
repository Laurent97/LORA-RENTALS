import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data, error } = await sb
    .from("geofence_alerts")
    .select("*, bookings:booking_id(id, customer:customer_id(name), vehicle:vehicle_id(make, model, plate))")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: data ?? [] });
}

export async function PATCH(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller || caller.role !== "admin") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { error } = await sb.from("geofence_alerts").update({ acknowledged: true }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
