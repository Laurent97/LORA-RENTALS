import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { bookingFromRow, vehicleFromRow } from "@/lib/supabase/mappers";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

// GET /api/track/:token — public endpoint for live trip tracking.
// Looks up the booking by qr_token or qr_code and returns the latest location.
export async function GET(req: Request, { params }: { params: { token: string } }) {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json({ error: "Tracking unavailable" }, { status: 503 });
  }

  const { token } = params;
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const { data: booking, error: bookingError } = await sb
    .from("bookings")
    .select("*")
    .or(`qr_token.eq.${token},qr_code.eq.${token}`)
    .maybeSingle();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  const [{ data: vehicle }, { data: customer }, { data: location }, { data: alert }] = await Promise.all([
    sb.from("vehicles").select("*").eq("id", booking.vehicle_id).maybeSingle(),
    sb.from("users").select("name").eq("id", booking.customer_id).maybeSingle(),
    sb
      .from("trip_locations")
      .select("*")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from("geofence_alerts")
      .select("*")
      .eq("booking_id", booking.id)
      .eq("acknowledged", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    booking: bookingFromRow(booking),
    vehicle: vehicle ? vehicleFromRow(vehicle) : null,
    customerName: customer?.name ?? null,
    location: location
      ? { lat: location.lat, lng: location.lng, recordedAt: location.created_at }
      : null,
    alert: alert
      ? { type: alert.type, message: alert.message, lat: alert.lat, lng: alert.lng, createdAt: alert.created_at }
      : null,
  });
}
