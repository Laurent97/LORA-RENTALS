import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function clean(row: any) {
  return { id: row.id, vehicle_id: row.vehicle_id, make: row.vehicles?.make, model: row.vehicles?.model, year: row.vehicles?.year, type: row.vehicles?.type };
}

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const [{ data: insurance }, { data: roadside }] = await Promise.all([
    sb.from("insurance_addons").select("*, vehicles:vehicle_id(make, model, year, type, images)").eq("status", "available"),
    sb.from("roadside_plans").select("*, vehicles:vehicle_id(make, model, year, type, images)").eq("status", "available"),
  ]);

  return NextResponse.json({
    insurance: (insurance ?? []).map((i: any) => ({ ...i, vehicle: clean(i) })),
    roadside: (roadside ?? []).map((r: any) => ({ ...r, vehicle: clean(r) })),
  });
}
