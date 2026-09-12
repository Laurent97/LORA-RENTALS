import { NextResponse } from "next/server";
import { getCallerProfile, getSupabaseAdmin } from "@/lib/supabase/admin";
import { createReviewSchema } from "@/lib/reviews/validators";
import { moderateText } from "@/lib/reviews/moderation";
import { REVIEW_RATE_LIMIT_PER_DAY } from "@/lib/reviews/constants";
import { audit, clientIp, notifyUser } from "@/lib/reviews/server";
import { dispatchEmailEvent } from "@/lib/postmark/triggers";
import { reviewFromRow } from "@/lib/supabase/mappers";

export const runtime = "nodejs";

// POST /api/reviews/create — customer leaves a review on a completed booking.
export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!sb || !caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (caller.role !== "customer") return NextResponse.json({ error: "Only customers can leave reviews" }, { status: 403 });

  const parsed = createReviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const input = parsed.data;

  // Booking must exist, belong to the caller, and be completed.
  const { data: booking } = await sb.from("bookings").select("*").eq("id", input.bookingId).maybeSingle();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.customer_id !== caller.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (booking.status !== "completed") {
    return NextResponse.json({ error: "You can review a trip once it is completed" }, { status: 422 });
  }

  // One review per booking.
  const { data: existing } = await sb.from("reviews").select("id").eq("booking_id", input.bookingId).maybeSingle();
  if (existing) return NextResponse.json({ error: "You already reviewed this trip" }, { status: 409 });

  // Rate limit: max N reviews per day.
  const since = new Date(Date.now() - 864e5).toISOString();
  const { count } = await sb
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", caller.id)
    .gte("created_at", since);
  if ((count ?? 0) >= REVIEW_RATE_LIMIT_PER_DAY) {
    return NextResponse.json({ error: "Review limit reached for today — try again tomorrow" }, { status: 429 });
  }

  // Moderation screen — flagged content is stored but held for admin review.
  const mod = moderateText(`${input.title ?? ""} ${input.comment}`);
  const status = mod.clean ? "published" : "flagged";

  const { data: row, error } = await sb
    .from("reviews")
    .insert({
      booking_id: input.bookingId,
      vehicle_id: booking.vehicle_id,
      customer_id: caller.id,
      owner_id: booking.owner_id,
      rating: input.rating,
      title: input.title || null,
      comment: input.comment,
      photos: input.photos,
      tags: input.tags,
      status,
      flag_reason: mod.clean ? null : mod.reasons.join(","),
      is_verified_booking: true,
    })
    .select("*, customer:users!customer_id(name)")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const review = reviewFromRow(row);
  await audit(sb, {
    reviewId: review.id,
    action: "created",
    actorId: caller.id,
    actorRole: caller.role,
    newValue: { rating: input.rating, status },
    reason: mod.clean ? undefined : `auto-flagged: ${mod.reasons.join(",")}`,
    ip: clientIp(req),
  });
  if (booking.owner_id) {
    await notifyUser(sb, booking.owner_id, `New ${input.rating}★ review`, `${review.customerName} reviewed your vehicle.`);
  }
  // Emails — published → customer confirm + owner notify; flagged → admin alert.
  const event = mod.clean ? "review.published" : "review.flagged";
  await dispatchEmailEvent({ event, id: review.id, actor: { id: caller.id, role: caller.role }, meta: { flag_count: 1, reason: mod.reasons.join(",") } });
  return NextResponse.json({ ok: true, review, flagged: !mod.clean });
}
