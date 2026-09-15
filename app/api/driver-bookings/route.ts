import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import { dispatchEmailEvent } from "@/lib/postmark/triggers";

export async function GET(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

    const caller = await getCallerProfile(req.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const asCustomer = searchParams.get("as") === "customer";

    let q = sb
      .from("driver_bookings")
      .select("*, driver:drivers(*), customer:users!customer_id(name, phone, email), booking:bookings(*, vehicle:vehicles(*))")
      .order("created_at", { ascending: false });

    if (caller.role === "admin") {
      // all
    } else if (asCustomer) {
      q = q.eq("customer_id", caller.id);
    } else {
      // driver view: resolve driver id from user id
      const { data: driver } = await sb.from("drivers").select("id").eq("user_id", caller.id).single();
      if (!driver) return NextResponse.json([]);
      q = q.eq("driver_id", driver.id);
    }

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []).map((r: any) => ({
      id: String(r.id),
      bookingId: String(r.booking_id),
      driverId: String(r.driver_id),
      customerId: String(r.customer_id),
      ownerId: String(r.owner_id ?? ""),
      serviceType: r.service_type ?? "full_day",
      startAt: r.start_at,
      endAt: r.end_at,
      pickupLocation: r.pickup_location,
      dropoffLocation: r.dropoff_location,
      passengers: r.passengers,
      rateRwf: Number(r.rate_rwf ?? 0),
      hours: r.hours,
      days: r.days,
      subtotalRwf: Number(r.subtotal_rwf ?? 0),
      platformCommissionRwf: Number(r.platform_commission_rwf ?? 0),
      driverNetRwf: Number(r.driver_net_rwf ?? 0),
      depositRwf: Number(r.deposit_rwf ?? 0),
      status: r.status,
      contactRevealedAt: r.contact_revealed_at,
      acceptedAt: r.accepted_at,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      cancelledAt: r.cancelled_at,
      cancelledBy: r.cancelled_by,
      cancellationReason: r.cancellation_reason,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      driver: r.driver
        ? {
            id: String(r.driver.id),
            fullName: String(r.driver.full_name ?? ""),
            phone: r.driver.phone ? String(r.driver.phone) : null,
            whatsapp: r.driver.whatsapp ? String(r.driver.whatsapp) : null,
            photoUrl: r.driver.photo_url ? String(r.driver.photo_url) : null,
            rating: Number(r.driver.rating ?? 0),
            reviewCount: Number(r.driver.review_count ?? 0),
          }
        : null,
      customer: r.customer
        ? { name: String(r.customer.name), phone: String(r.customer.phone), email: String(r.customer.email) }
        : null,
      vehicle: r.booking?.vehicle ? `${r.booking.vehicle.year} ${r.booking.vehicle.make} ${r.booking.vehicle.model}` : null,
      plate: r.booking?.vehicle?.plate ?? null,
    }));

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[driver-bookings GET] error:", err);
    return NextResponse.json({ error: "Could not load driver bookings" }, { status: 500 });
  }
}

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

    await dispatchEmailEvent({
      event: "driver.new_request",
      id: driverId,
      actor: { id: caller.id, role: caller.role },
      meta: { driverId, booking: bookingId },
    });

    return NextResponse.json({ ok: true, driverBooking: data });
  } catch (err) {
    console.error("[driver-bookings] error:", err);
    return NextResponse.json({ error: "failed to create driver booking" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ error: "not configured" }, { status: 500 });

    const caller = await getCallerProfile(req.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const { id, status } = (await req.json().catch(() => ({}))) as { id?: string; status?: string };
    if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

    const { data: existing } = await sb.from("driver_bookings").select("id, driver_id, status, driver_net_rwf, booking_id").eq("id", id).single();
    if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

    // resolve driver from user
    const { data: driver } = await sb.from("drivers").select("id, user_id").eq("user_id", caller.id).single();
    const isDriver = driver && driver.id === existing.driver_id;
    const isAdmin = caller.role === "admin";
    if (!isDriver && !isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status, updated_at: now };
    if (status === "accepted") patch.accepted_at = now;
    if (status === "in_progress") patch.started_at = now;
    if (status === "completed") {
      patch.completed_at = now;
      // credit driver net once trip is complete
      await sb.from("driver_earnings").insert({
        driver_id: existing.driver_id,
        driver_booking_id: id,
        amount_rwf: existing.driver_net_rwf ?? 0,
        type: "trip",
        status: "available",
        created_at: now,
      });
    }
    if (status === "cancelled") patch.cancelled_at = now;
    if (status === "confirmed") {
      // when confirmed, reveal contact
      patch.contact_revealed_at = now;
      patch.accepted_at = now;
    }

    const { data, error } = await sb.from("driver_bookings").update(patch).eq("id", id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (status === "confirmed") {
      await dispatchEmailEvent({
        event: "driver.request_confirmed",
        id,
        actor: { id: caller.id, role: caller.role },
        meta: { driverId: existing.driver_id, booking: existing.booking_id },
      });
    }

    if (status === "completed" && data) {
      const { data: avail } = await sb.from("driver_earnings").select("amount_rwf").eq("driver_id", existing.driver_id).eq("status", "available");
      const totalAvailable = (avail ?? []).reduce((s, r: any) => s + Number(r.amount_rwf ?? 0), 0);
      await dispatchEmailEvent({
        event: "driver.trip_completed",
        id,
        actor: { id: caller.id, role: caller.role },
        meta: { driverId: existing.driver_id, booking: existing.booking_id },
      });
      await dispatchEmailEvent({
        event: "driver.earnings_credited",
        id,
        actor: { id: caller.id, role: caller.role },
        meta: { driverId: existing.driver_id, amount_rwf: data.driver_net_rwf, total_available_rwf: totalAvailable, earning: existing.id },
      });
    }

    return NextResponse.json({ ok: true, driverBooking: data });
  } catch (err) {
    console.error("[driver-bookings PATCH] error:", err);
    return NextResponse.json({ error: "update failed" }, { status: 500 });
  }
}
