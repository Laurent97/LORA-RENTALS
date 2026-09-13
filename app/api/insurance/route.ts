import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import type { InsuranceAddon, RoadsidePlan } from "@/types";

const TIERS = ["basic", "standard", "premium"];
const STATUSES = ["available", "unavailable"];

function insuranceFromRow(row: Record<string, unknown>): InsuranceAddon {
  return {
    id: String(row.id ?? ""),
    vehicleId: String(row.vehicle_id ?? ""),
    tier: String(row.tier ?? "basic") as InsuranceAddon["tier"],
    dailyPrice: Number(row.daily_price ?? 0),
    liabilityCap: Number(row.liability_cap ?? 0),
    deductible: Number(row.deductible ?? 0),
    coverage: (row.coverage as string[]) ?? [],
    status: String(row.status ?? "available") as InsuranceAddon["status"],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function roadsideFromRow(row: Record<string, unknown>): RoadsidePlan {
  return {
    id: String(row.id ?? ""),
    vehicleId: String(row.vehicle_id ?? ""),
    providerName: String(row.provider_name ?? ""),
    dailyPrice: Number(row.daily_price ?? 0),
    services: (row.services as string[]) ?? [],
    responseMinutes: row.response_minutes ? Number(row.response_minutes) : undefined,
    status: String(row.status ?? "available") as RoadsidePlan["status"],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const vehicleId = new URL(req.url).searchParams.get("vehicleId");
  if (!vehicleId) return NextResponse.json({ error: "vehicleId required" }, { status: 400 });

  const [{ data: iRows }, { data: rRows }] = await Promise.all([
    sb.from("insurance_addons").select("*").eq("vehicle_id", vehicleId).eq("status", "available"),
    sb.from("roadside_plans").select("*").eq("vehicle_id", vehicleId).eq("status", "available"),
  ]);

  return NextResponse.json({
    insurance: (iRows ?? []).map(insuranceFromRow),
    roadside: (rRows ?? []).map(roadsideFromRow),
  });
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { kind, vehicleId, ...rest } = body;
  if (!vehicleId || !kind) {
    return NextResponse.json({ error: "kind and vehicleId required" }, { status: 400 });
  }

  const { data: vehicle } = await sb.from("vehicles").select("owner_id").eq("id", vehicleId).single();
  if (!vehicle) return NextResponse.json({ error: "vehicle not found" }, { status: 404 });
  if (vehicle.owner_id !== caller.id && caller.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let data, error;
  if (kind === "insurance") {
    const insert = {
      vehicle_id: vehicleId,
      tier: TIERS.includes(String(rest.tier)) ? rest.tier : "basic",
      daily_price: Number(rest.dailyPrice ?? 0),
      liability_cap: Number(rest.liabilityCap ?? 0),
      deductible: Number(rest.deductible ?? 0),
      coverage: (rest.coverage as string[]) ?? [],
      status: STATUSES.includes(String(rest.status)) ? rest.status : "available",
    };
    ({ data, error } = await sb.from("insurance_addons").insert(insert).select().single());
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(insuranceFromRow(data ?? {}), { status: 201 });
  }

  if (kind === "roadside") {
    const insert = {
      vehicle_id: vehicleId,
      provider_name: String(rest.providerName ?? ""),
      daily_price: Number(rest.dailyPrice ?? 0),
      services: (rest.services as string[]) ?? [],
      response_minutes: rest.responseMinutes ? Number(rest.responseMinutes) : null,
      status: STATUSES.includes(String(rest.status)) ? rest.status : "available",
    };
    ({ data, error } = await sb.from("roadside_plans").insert(insert).select().single());
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(roadsideFromRow(data ?? {}), { status: 201 });
  }

  return NextResponse.json({ error: "kind must be insurance or roadside" }, { status: 400 });
}
