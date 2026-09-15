import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

    const caller = await getCallerProfile(req.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      bookingId?: string;
      driverId?: string;
      startAt?: string;
      endAt?: string;
      pickupLocation?: string;
      dropoffLocation?: string;
      rateRwf?: number;
      days?: number;
      hours?: number;
      serviceType?: string;
    };

    const { bookingId, driverId, startAt, endAt, pickupLocation, dropoffLocation, rateRwf, days, hours, serviceType } = body;
    if (!bookingId || !driverId || !startAt || !rateRwf) {
      return NextResponse.json({ error: "bookingId, driverId, startAt, rateRwf required" }, { status: 400 });
    }

    const { data: booking, error: bookingErr } = await sb.from("bookings").select("customer_id, owner_id, vehicle_id").eq("id", bookingId).single();
    if (bookingErr || !booking) return NextResponse.json({ error: bookingErr?.message ?? "booking not found" }, { status: 404 });
    if (booking.customer_id !== caller.id && caller.role !== "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { data: driver, error: driverErr } = await sb.from("drivers").select("id, user_id, is_verified, is_available").eq("id", driverId).single();
    if (driverErr || !driver) return NextResponse.json({ error: driverErr?.message ?? "driver not found" }, { status: 404 });
    if (!driver.is_verified || !driver.is_available) {
      return NextResponse.json({ error: "driver is not verified or available" }, { status: 400 });
    }

    const subtotal = (rateRwf ?? 0) * (days ?? 1);
    const commission = Math.floor(subtotal * 0.1);
    const driverNet = subtotal - commission;

    const { data, error } = await sb.from("driver_bookings").insert({
      booking_id: bookingId,
      driver_id: driverId,
      customer_id: booking.customer_id,
      owner_id: booking.owner_id,
      service_type: serviceType ?? "full_day",
      start_at: startAt,
      end_at: endAt ?? startAt,
      pickup_location: pickupLocation ?? null,
      dropoff_location: dropoffLocation ?? null,
      rate_rwf: rateRwf,
      hours: hours ?? 0,
      days: days ?? 1,
      subtotal_rwf: subtotal,
      platform_commission_rwf: commission,
      driver_net_rwf: driverNet,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, driverBooking: data });
  } catch (err) {
    console.error("[driver-bookings] error:", err);
    return NextResponse.json({ error: "failed to create driver booking" }, { status: 500 });
  }
}
