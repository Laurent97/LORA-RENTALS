import { NextResponse } from "next/server";
import { getSupabaseAdmin, getCallerProfile } from "@/lib/supabase/admin";
import { bookingFromRow, userFromRow, vehicleFromRow } from "@/lib/supabase/mappers";
import { normalizeBookingQrInput, parseBookingQrPayload } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const caller = await getCallerProfile(req.headers.get("authorization"));
    if (!caller || (caller.role !== "owner" && caller.role !== "admin")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { code } = (await req.json().catch(() => ({}))) as { code?: string };
    if (!code?.trim()) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    const normalized = normalizeBookingQrInput(code.trim()) ?? code.trim();
    const parsed = parseBookingQrPayload(normalized);
    const token = parsed?.token ?? normalized;

    const q = sb
      .from("bookings")
      .select("*, vehicles(*), customer:users!customer_id(*), owner:users!owner_id(*)")
      .or(`qr_token.eq.${token},qr_code.ilike.${token}`)
      .maybeSingle();

    const { data: row, error } = await q;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ error: "No booking matches that code" }, { status: 404 });
    }

    const booking = bookingFromRow(row);
    if (caller.role === "owner" && booking.ownerId !== caller.id) {
      return NextResponse.json({ error: "This booking isn't for one of your vehicles" }, { status: 403 });
    }

    const v = (row as any).vehicles;
    const customer = (row as any).customer;
    const owner = (row as any).owner;

    return NextResponse.json({
      booking,
      vehicle: v ? vehicleFromRow(v) : null,
      customer: customer ? userFromRow(customer) : null,
      owner: owner ? userFromRow(owner) : null,
    });
  } catch (err) {
    console.error("[scan/lookup] error:", err);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
