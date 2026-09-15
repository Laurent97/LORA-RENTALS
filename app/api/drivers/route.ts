import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

    const { searchParams } = new URL(req.url);
    const onlyVerified = searchParams.get("verified") !== "false";
    const onlyAvailable = searchParams.get("available") !== "false";
    const city = searchParams.get("city");
    const language = searchParams.get("language");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);

    let q = sb
      .from("drivers")
      .select("*, owner:users!owner_id(name, email, phone, deleted_at)")
      .is("owner.deleted_at", null)
      .order("rating", { ascending: false })
      .limit(limit);

    if (onlyVerified) q = q.eq("is_verified", true);
    if (onlyAvailable) q = q.eq("is_available", true);
    if (city) q = q.or(`home_city.ilike.${city},serves_cities.cs.{${city}}`);
    if (language) q = q.contains("languages", [language]);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const drivers = (data ?? []).map((d: any) => ({
      id: String(d.id ?? ""),
      ownerId: String(d.owner_id ?? ""),
      userId: String(d.user_id ?? ""),
      fullName: String(d.full_name ?? d.owner?.name ?? "Chauffeur"),
      phone: d.phone ? String(d.phone) : null,
      whatsapp: d.whatsapp ? String(d.whatsapp) : null,
      email: d.email ? String(d.email) : null,
      photoUrl: d.photo_url ? String(d.photo_url) : null,
      bio: d.bio ? String(d.bio) : null,
      languages: (d.languages as string[]) ?? [],
      vehicleTypes: (d.vehicle_types as string[]) ?? [],
      yearsOfExperience: Number(d.years_of_experience ?? 0),
      licenseNumber: d.license_number ? String(d.license_number) : null,
      licenseExpiry: d.license_expiry ? String(d.license_expiry) : null,
      backgroundCheckStatus: d.license_verified ? "approved" : "pending",
      specialties: (d.specialties as string[]) ?? [],
      driverType: (d.driver_type as any) ?? "owner_attached",
      isIndependent: Boolean(d.is_independent ?? false),
      isAvailable: Boolean(d.is_available ?? true),
      isVerified: Boolean(d.is_verified ?? false),
      dailyRateRwf: d.daily_rate_rwf ? Number(d.daily_rate_rwf) : null,
      hourlyRateRwf: d.hourly_rate_rwf ? Number(d.hourly_rate_rwf) : null,
      halfDayRateRwf: d.half_day_rate_rwf ? Number(d.half_day_rate_rwf) : null,
      airportPickupRateRwf: d.airport_pickup_rate_rwf ? Number(d.airport_pickup_rate_rwf) : null,
      homeCity: d.home_city ? String(d.home_city) : null,
      servesCities: (d.serves_cities as string[]) ?? [],
      minHours: Number(d.min_hours ?? 4),
      serviceRadiusKm: Number(d.service_radius_km ?? 50),
      maxPassengers: Number(d.max_passengers ?? 5),
      availableFrom: String(d.available_from ?? "06:00"),
      availableUntil: String(d.available_until ?? "22:00"),
      unavailableDates: (d.unavailable_dates as string[]) ?? [],
      totalTrips: Number(d.total_trips ?? 0),
      totalEarningsRwf: Number(d.total_earnings_rwf ?? 0),
      outstandingBalanceRwf: Number(d.outstanding_balance_rwf ?? 0),
      kycStatus: (d.kyc_status as any) ?? "pending",
      ratingAvg: Number(d.rating ?? 0),
      ratingCount: Number(d.review_count ?? 0),
      createdAt: String(d.created_at ?? new Date().toISOString()),
      updatedAt: String(d.updated_at ?? new Date().toISOString()),
      ownerName: d.owner?.name ?? null,
    }));

    return NextResponse.json(drivers);
  } catch (err) {
    console.error("[drivers] error:", err);
    return NextResponse.json({ error: "Could not load drivers" }, { status: 500 });
  }
}
