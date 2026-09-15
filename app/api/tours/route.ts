import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import type { Driver, Tour } from "@/types";

const TOUR_STATUSES = ["available", "unavailable"];

function tourFromRow(row: Record<string, unknown>): Tour {
  return {
    id: String(row.id ?? ""),
    driverId: String(row.driver_id ?? ""),
    title: String(row.title ?? ""),
    description: row.description ? String(row.description) : undefined,
    price: Number(row.price ?? 0),
    durationHours: Number(row.duration_hours ?? 0),
    languages: (row.languages as string[]) ?? [],
    itinerary: (row.itinerary as string[]) ?? [],
    status: String(row.status ?? "available") as Tour["status"],
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function driverFromRow(row: Record<string, unknown>, fullName = ""): Driver {
  return {
    id: String(row.id ?? ""),
    ownerId: String(row.user_id ?? ""),
    fullName,
    phone: String(row.phone ?? ""),
    whatsapp: row.whatsapp ? String(row.whatsapp) : undefined,
    email: row.email ? String(row.email) : undefined,
    bio: row.bio ? String(row.bio) : undefined,
    languages: (row.languages as string[]) ?? [],
    backgroundCheckStatus: row.license_verified ? "approved" : "pending",
    yearsOfExperience: Number(row.years_of_experience ?? 0),
    specialties: (row.specialties as string[]) ?? [],
    ratingAvg: Number(row.rating ?? 0),
    ratingCount: Number(row.review_count ?? 0),
    isAvailable: Boolean(row.is_available ?? true),
    isVerified: Boolean(row.license_verified ?? false),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  };
}

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const [{ data: tRows }, { data: dRows }, { data: uRows }] = await Promise.all([
    sb.from("tours").select("*").eq("status", "available").order("price", { ascending: true }),
    sb.from("drivers").select("*"),
    sb.from("users").select("id, name, avatar"),
  ]);

  const tourRows = tRows ?? [];
  const driverRows = dRows ?? [];
  const userRows = uRows ?? [];

  const drivers = new Map(driverRows.map((d) => [d.id, driverFromRow(d, userRows.find((u) => u.id === d.user_id)?.name ?? "")]));
  const tours = tourRows.map((t) => ({ ...tourFromRow(t), driver: drivers.get(t.driver_id) }));

  return NextResponse.json(tours);
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Partial<Tour> & { driverId: string };
  const { driverId, title, description, price, durationHours, languages, itinerary } = body;

  if (!driverId || !title || !price || !durationHours) {
    return NextResponse.json({ error: "driverId, title, price, durationHours required" }, { status: 400 });
  }

  const { data: driver } = await sb.from("drivers").select("user_id").eq("id", driverId).single();
  if (!driver) return NextResponse.json({ error: "driver not found" }, { status: 404 });
  if (driver.user_id !== caller.id && caller.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const insert: Record<string, unknown> = {
    driver_id: driverId,
    title,
    description: description ?? null,
    price,
    duration_hours: durationHours,
    languages: languages ?? [],
    itinerary: itinerary ?? [],
    status: body.status && TOUR_STATUSES.includes(body.status) ? body.status : "available",
  };

  const { data, error } = await sb.from("tours").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(tourFromRow(data ?? {}), { status: 201 });
}
