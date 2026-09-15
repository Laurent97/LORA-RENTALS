import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import type { LongTermLease } from "@/types";

export const dynamic = "force-dynamic";

const STATUSES = ["draft", "pending", "active", "paused", "cancelled", "completed"];

function fromRow(row: Record<string, unknown>): LongTermLease {
  return {
    id: String(row.id ?? ""),
    vehicleId: String(row.vehicle_id ?? ""),
    customerId: row.customer_id ? String(row.customer_id) : undefined,
    ownerId: String(row.owner_id ?? ""),
    startDate: String(row.start_date ?? ""),
    endDate: String(row.end_date ?? ""),
    monthlyPrice: Number(row.monthly_price ?? 0),
    maintenanceIncluded: Boolean(row.maintenance_included ?? true),
    swapAllowed: Boolean(row.swap_allowed ?? true),
    autoRenewal: Boolean(row.auto_renewal ?? false),
    status: String(row.status ?? "draft") as LongTermLease["status"],
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export async function GET(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "draft";
  const { data } = await sb
    .from("long_term_leases")
    .select("*")
    .eq("status", status)
    .order("monthly_price", { ascending: true })
    .limit(50);

  return NextResponse.json((data ?? []).map(fromRow));
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Partial<LongTermLease> & { vehicleId: string };
  const { vehicleId, startDate, endDate, monthlyPrice, maintenanceIncluded, swapAllowed, autoRenewal, status, notes } = body;

  if (!vehicleId || !startDate || !endDate || !monthlyPrice) {
    return NextResponse.json({ error: "vehicleId, startDate, endDate, monthlyPrice required" }, { status: 400 });
  }

  const { data: vehicle } = await sb.from("vehicles").select("owner_id").eq("id", vehicleId).single();
  if (!vehicle) return NextResponse.json({ error: "vehicle not found" }, { status: 404 });
  if (vehicle.owner_id !== caller.id && caller.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const insert: Record<string, unknown> = {
    vehicle_id: vehicleId,
    owner_id: vehicle.owner_id,
    start_date: startDate,
    end_date: endDate,
    monthly_price: monthlyPrice,
    maintenance_included: maintenanceIncluded ?? true,
    swap_allowed: swapAllowed ?? true,
    auto_renewal: autoRenewal ?? false,
    status: status && STATUSES.includes(status) ? status : "draft",
    notes: notes ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await sb.from("long_term_leases").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(fromRow(data ?? {}), { status: 201 });
}
