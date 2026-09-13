import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { TrustScore } from "@/types";

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function tierFromTotal(total: number): TrustScore["tier"] {
  if (total < 40) return "bronze";
  if (total < 55) return "silver";
  if (total < 70) return "gold";
  if (total < 85) return "platinum";
  return "diamond";
}

export async function POST(req: Request) {
  try {
    const { userId } = (await req.json().catch(() => ({}))) as { userId?: string };
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ error: "not configured" }, { status: 500 });
    }

    const { data: user, error: userErr } = await sb
      .from("users")
      .select("id,kyc_status,avg_response_minutes,role")
      .eq("id", userId)
      .single();
    if (userErr || !user) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    const ownerBookings = (await sb
      .from("bookings")
      .select("id,status,customer_id,owner_id,created_at")
      .eq("owner_id", userId)).data ?? [];
    const customerBookings = (await sb
      .from("bookings")
      .select("id,status,customer_id,owner_id,created_at")
      .eq("customer_id", userId)).data ?? [];
    const reviews = (await sb
      .from("reviews")
      .select("rating,status")
      .eq("owner_id", userId)).data ?? [];
    const kycDocs = (await sb
      .from("kyc_documents")
      .select("id,status")
      .eq("user_id", userId)
      .eq("status", "verified")).data ?? [];

    const ownerBookingIds = ownerBookings.map((b) => b.id);
    let disputes: { id: string; booking_id: string; raised_by: string; status: string }[] = [];
    if (ownerBookingIds.length > 0) {
      const { data } = await sb.from("disputes").select("id,booking_id,raised_by,status").in("booking_id", ownerBookingIds);
      disputes = data ?? [];
    }

    // KYC (max 15)
    let kyc = 0;
    if (user.kyc_status === "verified") kyc = 15;
    else if (user.kyc_status === "pending") kyc = 8;
    if (kycDocs.length >= 3 && kyc < 15) kyc = 15;

    // Response time (max 15)
    let response = 8;
    const rmin = user.avg_response_minutes;
    if (rmin != null) {
      if (rmin <= 60) response = 15;
      else if (rmin <= 240) response = 10;
      else if (rmin <= 720) response = 5;
      else response = 0;
    }

    // Cancellation rate (max 15)
    const allBookings = [...ownerBookings, ...customerBookings];
    const totalBookings = allBookings.length;
    const cancelled = allBookings.filter((b) => b.status === "cancelled").length;
    const cancellationRate = totalBookings ? cancelled / totalBookings : 0;
    let cancellation: number;
    if (totalBookings === 0) cancellation = 10;
    else if (cancellationRate < 0.05) cancellation = 15;
    else if (cancellationRate < 0.15) cancellation = 10;
    else if (cancellationRate < 0.3) cancellation = 5;
    else cancellation = 0;

    // Rating (max 15)
    const published = reviews.filter((r) => r.status === "published");
    const avg = published.length ? published.reduce((s, r) => s + r.rating, 0) / published.length : 0;
    let rating: number;
    if (avg >= 4.5) rating = 15;
    else if (avg >= 4) rating = 12;
    else if (avg >= 3.5) rating = 9;
    else if (avg >= 3) rating = 6;
    else if (avg > 0) rating = 3;
    else rating = 10;

    // Damage (max 10): proxy from disputes on bookings where user is owner
    const ownerDisputeCount = disputes.length;
    let damage = clamp(10 - ownerDisputeCount * 3, 0, 10);

    // Punctuality (max 10)
    const completed = allBookings.filter((b) => b.status === "completed").length;
    let punctuality: number;
    if (completed > 0 && cancellationRate < 0.1) punctuality = 10;
    else if (completed > 0) punctuality = 5;
    else punctuality = 0;

    // Repeat customers (max 10): distinct customers for owner
    const customers = new Set(ownerBookings.map((b) => b.customer_id)).size;
    let repeatCustomer: number;
    if (customers >= 10) repeatCustomer = 10;
    else if (customers >= 5) repeatCustomer = 7;
    else if (customers >= 2) repeatCustomer = 4;
    else if (customers >= 1) repeatCustomer = 2;
    else repeatCustomer = 0;

    // Dispute (max 15)
    let dispute: number;
    if (ownerDisputeCount === 0) dispute = 15;
    else if (ownerDisputeCount < 3) dispute = 10;
    else if (ownerDisputeCount < 5) dispute = 5;
    else dispute = 0;

    const total = kyc + response + cancellation + rating + damage + punctuality + repeatCustomer + dispute;
    const tier = tierFromTotal(total);
    const updatedAt = new Date().toISOString();

    const upsert = {
      user_id: userId,
      total,
      kyc,
      response,
      cancellation,
      rating,
      damage,
      punctuality,
      repeat_customer: repeatCustomer,
      dispute,
      tier,
      updated_at: updatedAt,
    };
    await sb.from("user_trust_scores").upsert(upsert, { onConflict: "user_id" });

    const out: TrustScore = {
      userId,
      total,
      kyc,
      response,
      cancellation,
      rating,
      damage,
      punctuality,
      repeatCustomer,
      dispute,
      tier,
      updatedAt,
    };
    return NextResponse.json(out);
  } catch (err) {
    console.error("[trust] error:", err);
    return NextResponse.json({ error: "trust score failed" }, { status: 500 });
  }
}
