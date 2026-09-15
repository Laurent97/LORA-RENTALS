import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const [{ data: evs }, { data: stations }] = await Promise.all([
    sb.from("ev_vehicles").select("*, vehicles:vehicle_id(*, owner:owner_id(name))").gt("range_km", 0),
    sb.from("charging_stations").select("*").eq("available", true),
  ]);

  return NextResponse.json({
    vehicles: evs ?? [],
    stations: stations ?? [],
  });
}
