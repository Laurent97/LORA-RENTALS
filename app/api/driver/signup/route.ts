import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

    const body = (await req.json().catch(() => ({}))) as any;
    const {
      email,
      password,
      fullName,
      phone,
      whatsapp,
      dateOfBirth,
      gender,
      nationality,
      city,
      district,
      languages,
      photoUrl,
      licenseNumber,
      licensePhotoUrl,
      licenseExpiry,
      nationalIdUrl,
      passportPhotoUrl,
      criminalRecordUrl,
      yearsOfExperience,
      bio,
      specialties,
      vehicleTypes,
      dailyRateRwf,
      halfDayRateRwf,
      airportPickupRateRwf,
      homeCity,
      servesCities,
      minHours,
      serviceRadiusKm,
      maxPassengers,
      acceptsLongDistance,
      acceptsAirportPickup,
      acceptsNightDriving,
      acceptsOutsideKigali,
      availableFrom,
      availableUntil,
    } = body;

    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(cleanEmail) || !password || !fullName || !phone || !licenseNumber) {
      return NextResponse.json({ error: "A valid email, password, full name, phone, and license number are required" }, { status: 400 });
    }

    const { data: existing, error: existingErr } = await sb.from("users").select("id").eq("email", cleanEmail).maybeSingle();
    if (existingErr) {
      return NextResponse.json({ error: `Lookup failed: ${existingErr.message}` }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const { data: auth, error: authError } = await sb.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { name: fullName },
    });

    if (authError || !auth.user) {
      return NextResponse.json({ error: authError?.message ?? "Could not create account" }, { status: 500 });
    }

    const userId = auth.user.id;

    const { error: userError } = await sb.from("users").insert({
      id: userId,
      role: "driver",
      name: fullName,
      email: cleanEmail,
      phone,
      kyc_status: "pending",
      created_at: new Date().toISOString(),
    });

    if (userError) {
      await sb.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    const { error: driverError } = await sb.from("drivers").insert({
      user_id: userId,
      owner_id: userId,
      full_name: fullName,
      phone,
      whatsapp,
      email,
      date_of_birth: dateOfBirth ?? null,
      gender: gender ?? null,
      nationality: nationality ?? null,
      district: district ?? null,
      home_city: (homeCity && String(homeCity).trim() ? homeCity : city) ?? null,
      languages: languages ?? [],
      photo_url: photoUrl ?? null,
      license_number: licenseNumber,
      license_photo_url: licensePhotoUrl ?? null,
      license_expiry: licenseExpiry ?? null,
      national_id_url: nationalIdUrl ?? null,
      passport_photo_url: passportPhotoUrl ?? null,
      criminal_record_url: criminalRecordUrl ?? null,
      years_of_experience: yearsOfExperience ?? 0,
      bio: bio ?? null,
      specialties: specialties ?? [],
      vehicle_types: vehicleTypes ?? [],
      driver_type: "independent",
      is_independent: true,
      kyc_status: "submitted",
      is_verified: false,
      is_available: true,
      daily_rate_rwf: dailyRateRwf ?? null,
      half_day_rate_rwf: halfDayRateRwf ?? null,
      airport_pickup_rate_rwf: airportPickupRateRwf ?? null,
      serves_cities: servesCities ?? [],
      min_hours: minHours ?? 4,
      service_radius_km: serviceRadiusKm ?? 50,
      max_passengers: maxPassengers ?? 5,
      accepts_long_distance: acceptsLongDistance ?? true,
      accepts_airport_pickup: acceptsAirportPickup ?? true,
      accepts_night_driving: acceptsNightDriving ?? true,
      accepts_outside_kigali: acceptsOutsideKigali ?? true,
      available_from: availableFrom ?? "06:00",
      available_until: availableUntil ?? "22:00",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (driverError) {
      await sb.from("users").delete().eq("id", userId);
      await sb.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: driverError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, userId, message: "Driver application submitted. Pending verification." });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[driver/signup] error:", err);
    return NextResponse.json({ error: message || "Signup failed" }, { status: 500 });
  }
}
