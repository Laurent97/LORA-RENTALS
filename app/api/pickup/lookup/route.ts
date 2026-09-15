import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { bookingFromRow, userFromRow, vehicleFromRow } from "@/lib/supabase/mappers";
import { bookingRef, normalizeBookingQrInput, parseBookingQrPayload } from "@/lib/utils";

function isBookingRef(v: string) {
  return /^LRA-[A-F0-9]{6}$/i.test(v);
}

export async function GET(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const rawCode = searchParams.get("code") ?? "";
    if (!rawCode.trim()) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    let payload = normalizeBookingQrInput(rawCode) ?? rawCode;
    const parsed = parseBookingQrPayload(payload);
    let token = parsed?.token ?? payload;

    if (isBookingRef(payload)) {
      token = payload;
    }

    let q = sb
      .from("bookings")
      .select("*, vehicles(*), customer:users!customer_id(*), owner:users!owner_id(*)")
      .or(`qr_token.eq.${token},qr_code.ilike.${token}`)
      .maybeSingle();

    if (isBookingRef(token)) {
      q = sb
        .from("bookings")
        .select("*, vehicles(*), customer:users!customer_id(*), owner:users!owner_id(*)")
        .ilike("qr_code", token)
        .maybeSingle();
    }

    const { data: row, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ error: "No booking found for this code" }, { status: 404 });
    }

    const booking = bookingFromRow(row);
    const v = (row as any).vehicles;
    const customer = (row as any).customer;
    const owner = (row as any).owner;

    return NextResponse.json({
      booking,
      ref: bookingRef(booking.id),
      vehicle: v ? vehicleFromRow(v) : null,
      customer: customer ? userFromRow(customer) : null,
      owner: owner ? userFromRow(owner) : null,
    });
  } catch (err) {
    console.error("[pickup/lookup] error:", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
