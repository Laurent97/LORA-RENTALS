import { NextResponse } from "next/server";
import { getCallerProfile, getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ status: "awaiting_confirmation" });
  const caller = await getCallerProfile(request.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  const body = await request.json() as { paymentId?: string; transactionId?: string };
  if (!body.paymentId) return NextResponse.json({ error: "Payment id is required." }, { status: 400 });
  const { data: payment } = await sb.from("payments").select("id, booking_id, user_id").eq("id", body.paymentId).single();
  if (!payment || (payment.user_id !== caller.id && caller.role !== "admin")) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  const isAdmin = caller.role === "admin";
  const patch = { status: isAdmin ? "completed" : "awaiting_confirmation", transaction_id: body.transactionId ?? null, ...(isAdmin ? { confirmed_by_admin: caller.id, confirmed_at: new Date().toISOString() } : {}) };
  const { error } = await sb.from("payments").update(patch).eq("id", payment.id);
  if (error) return NextResponse.json({ error: "Could not update payment." }, { status: 500 });
  await sb.from("payment_events").insert({ payment_id: payment.id, event_type: isAdmin ? "confirmed" : "customer_review_requested", payload: { transaction_id: body.transactionId ?? null } });
  if (isAdmin) await sb.from("bookings").update({ payment_confirmed: true }).eq("id", payment.booking_id);
  return NextResponse.json({ status: patch.status });
}