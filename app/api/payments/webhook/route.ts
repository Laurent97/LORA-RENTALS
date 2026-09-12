import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const expected = process.env.PAYMENT_WEBHOOK_SECRET;
  if (expected && request.headers.get("x-payment-webhook-secret") !== expected) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ received: true });
  const body = await request.json() as { reference?: string; status?: string; transaction_id?: string; reason?: string };
  if (!body.reference) return NextResponse.json({ error: "Reference is required." }, { status: 400 });
  const { data: payment } = await sb.from("payments").select("id, booking_id").eq("id", body.reference).single();
  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  const completed = body.status === "successful" || body.status === "completed";
  await sb.from("payments").update({ status: completed ? "completed" : "failed", transaction_id: body.transaction_id ?? null, failure_reason: completed ? null : body.reason ?? "Provider rejected payment", confirmed_at: completed ? new Date().toISOString() : null }).eq("id", payment.id);
  await sb.from("payment_events").insert({ payment_id: payment.id, event_type: completed ? "confirmed" : "failed", payload: body });
  if (completed) await sb.from("bookings").update({ payment_confirmed: true }).eq("id", payment.booking_id);
  return NextResponse.json({ received: true });
}