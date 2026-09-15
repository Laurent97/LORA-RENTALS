import { NextResponse } from "next/server";
import { buildUSSD, isValidRwandaPhone, normalizeRwandaPhone, type Provider } from "@/lib/ussd/build";
import { getCallerProfile, getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const PROVIDERS = new Set<Provider>(["mtn", "airtel", "ekash"]);

export async function POST(request: Request) {
  try {
    const body = await request.json() as { bookingId?: string; phone?: string; amount?: number; provider?: Provider; idempotencyKey?: string };
    const phone = normalizeRwandaPhone(body.phone ?? "");
    const amount = Math.round(Number(body.amount));
    if (!body.bookingId || !isValidRwandaPhone(phone) || !Number.isSafeInteger(amount) || amount < 1 || !PROVIDERS.has(body.provider as Provider)) {
      return NextResponse.json({ error: "Enter a valid booking, Rwanda phone number, amount, and provider." }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ paymentId: crypto.randomUUID(), status: "awaiting_confirmation", ussdCode: buildUSSD({ provider: body.provider as Provider, phone, amount }) });

    const caller = await getCallerProfile(request.headers.get("authorization"));
    if (!caller) return NextResponse.json({ error: "Sign in is required to start a payment." }, { status: 401 });
    const { data: booking } = await sb.from("bookings").select("id, customer_id, total_price").eq("id", body.bookingId).single();
    if (!booking || booking.customer_id !== caller.id) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (amount > booking.total_price) return NextResponse.json({ error: "Payment cannot exceed the booking total." }, { status: 400 });

    const since = new Date(Date.now() - 15 * 60_000).toISOString();
    const { count } = await sb.from("payments").select("id", { count: "exact", head: true }).eq("booking_id", booking.id).gte("created_at", since).in("status", ["pending", "awaiting_confirmation"]);
    if ((count ?? 0) >= 3) return NextResponse.json({ error: "Too many attempts. Please wait 15 minutes or contact LORA." }, { status: 429 });

    const ussdCode = buildUSSD({ provider: body.provider as Provider, phone, amount });
    const { data: payment, error } = await sb.from("payments").insert({
      booking_id: booking.id, user_id: caller.id, amount: amount, amount_rwf: amount, method: "ussd", point: "pickup",
      provider: body.provider, phone, ussd_code: ussdCode, status: "pending", metadata: { idempotency_key: body.idempotencyKey ?? null },
    }).select("id").single();
    if (error || !payment) return NextResponse.json({ error: "Could not create payment attempt." }, { status: 500 });
    await sb.from("payment_events").insert({ payment_id: payment.id, event_type: "initiated", payload: { provider: body.provider, amount, phone } });
    return NextResponse.json({ paymentId: payment.id, status: "pending", ussdCode });
  } catch {
    return NextResponse.json({ error: "Invalid payment request." }, { status: 400 });
  }
}