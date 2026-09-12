import { NextResponse } from "next/server";
import { getCallerProfile, getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminDeleteSchema } from "@/lib/reviews/validators";
import { audit, clientIp, loadReviewBundle, notifyUser } from "@/lib/reviews/server";
import { dispatchEmailEvent } from "@/lib/postmark/triggers";

export const runtime = "nodejs";

// POST /api/reviews/admin-delete — ADMIN ONLY. Hard-deletes a review (cascades
// to its reply) or just the reply when `replyOnly` is set. Requires a reason
// and the literal confirmation string "DELETE". Both parties are notified.
export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!sb || !caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (caller.role !== "admin") return NextResponse.json({ error: "Only admins can delete reviews" }, { status: 403 });

  const parsed = adminDeleteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const input = parsed.data;

  const bundle = await loadReviewBundle(sb, input.reviewId);
  if (!bundle) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  const { review, customer, owner } = bundle;

  if (input.replyOnly) {
    if (!review.reply) return NextResponse.json({ error: "This review has no reply" }, { status: 404 });
    const { error } = await sb.from("review_replies").delete().eq("id", review.reply.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await audit(sb, {
      reviewId: review.id,
      replyId: review.reply.id,
      action: "reply_deleted",
      actorId: caller.id,
      actorRole: "admin",
      oldValue: { comment: review.reply.comment },
      reason: input.reason,
      ip: clientIp(req),
    });
    if (owner) await notifyUser(sb, owner.id, "Your reply was removed", `A LORA admin removed your reply. Reason: ${input.reason}`);
    await dispatchEmailEvent({
      event: "review.reply_deleted",
      id: review.id,
      actor: { id: caller.id, role: "admin" },
      meta: { reason: input.reason, reply_excerpt: review.reply.comment.slice(0, 200) },
    });
    return NextResponse.json({ ok: true, deleted: true, replyOnly: true });
  }

  // Hard delete — review_replies cascade via FK.
  const { error } = await sb.from("reviews").delete().eq("id", review.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(sb, {
    reviewId: review.id,
    replyId: review.reply?.id,
    action: "deleted",
    actorId: caller.id,
    actorRole: "admin",
    oldValue: {
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      status: review.status,
      reply: review.reply?.comment,
    },
    reason: input.reason + (input.note ? ` — ${input.note}` : ""),
    ip: clientIp(req),
  });
  if (customer) {
    await notifyUser(sb, customer.id, "Your review was removed", `A LORA admin removed your review. Reason: ${input.reason}`);
  }
  if (owner) {
    await notifyUser(sb, owner.id, "A review on your car was removed", `A LORA admin removed a review. Reason: ${input.reason}`);
  }
  // Row is gone — pass everything the templates need via meta.
  await dispatchEmailEvent({
    event: "review.deleted",
    id: review.id,
    actor: { id: caller.id, role: "admin" },
    meta: {
      reason: input.reason,
      customer_id: review.customerId,
      owner_id: review.ownerId,
      customer_name: customer?.name,
      owner_name: owner?.name,
      vehicle_name: bundle.vehicle ? `${bundle.vehicle.make} ${bundle.vehicle.model} ${bundle.vehicle.year}` : "vehicle",
      rating: review.rating,
      review_excerpt: review.comment.slice(0, 200),
      booking_ref: review.bookingId.slice(0, 6).toUpperCase(),
    },
  });
  return NextResponse.json({ ok: true, deleted: true });
}
