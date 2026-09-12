import { NextResponse } from "next/server";
import { getCallerProfile, getSupabaseAdmin } from "@/lib/supabase/admin";
import { replySchema } from "@/lib/reviews/validators";
import { moderateText } from "@/lib/reviews/moderation";
import { REPLY_EDIT_WINDOW_HOURS } from "@/lib/reviews/constants";
import { audit, clientIp, notifyUser } from "@/lib/reviews/server";
import { dispatchEmailEvent } from "@/lib/postmark/triggers";
import { replyFromRow } from "@/lib/supabase/mappers";

export const runtime = "nodejs";

// POST /api/reviews/reply — owner replies to a review on their vehicle (once),
// or edits their reply within 48h when `edit: true` is passed.
export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!sb || !caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (caller.role !== "owner") return NextResponse.json({ error: "Only vehicle owners can reply" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = replySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const input = parsed.data;
  const isEdit = body?.edit === true;

  const { data: review } = await sb.from("reviews").select("*").eq("id", input.reviewId).maybeSingle();
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (review.owner_id !== caller.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (review.status !== "published" && !isEdit) {
    return NextResponse.json({ error: "You can only reply to published reviews" }, { status: 422 });
  }

  const mod = moderateText(input.comment);
  if (!mod.clean) {
    return NextResponse.json({ error: "Your reply was blocked by the content filter — please rephrase" }, { status: 422 });
  }

  if (isEdit) {
    const { data: existing } = await sb.from("review_replies").select("*").eq("review_id", review.id).maybeSingle();
    if (!existing) return NextResponse.json({ error: "No reply to edit" }, { status: 404 });
    if (existing.owner_id !== caller.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (Date.now() - new Date(existing.created_at).getTime() > REPLY_EDIT_WINDOW_HOURS * 36e5) {
      return NextResponse.json({ error: `Replies can only be edited within ${REPLY_EDIT_WINDOW_HOURS} hours` }, { status: 422 });
    }
    const { data: updated, error } = await sb
      .from("review_replies")
      .update({ comment: input.comment, edited_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*, owner:users!owner_id(name)")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await audit(sb, {
      reviewId: review.id,
      replyId: existing.id,
      action: "reply_edited",
      actorId: caller.id,
      actorRole: caller.role,
      oldValue: { comment: existing.comment },
      newValue: { comment: input.comment },
      ip: clientIp(req),
    });
    return NextResponse.json({ ok: true, reply: replyFromRow(updated) });
  }

  const { data: inserted, error } = await sb
    .from("review_replies")
    .insert({ review_id: review.id, owner_id: caller.id, comment: input.comment })
    .select("*, owner:users!owner_id(name)")
    .single();
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "You already replied to this review" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await audit(sb, {
    reviewId: review.id,
    replyId: inserted.id,
    action: "replied",
    actorId: caller.id,
    actorRole: caller.role,
    newValue: { comment: input.comment },
    ip: clientIp(req),
  });
  await notifyUser(sb, review.customer_id, "Owner replied to your review", "The owner responded to your review — tap to read.");
  await dispatchEmailEvent({ event: "review.replied", id: review.id, actor: { id: caller.id, role: caller.role } });
  return NextResponse.json({ ok: true, reply: replyFromRow(inserted) });
}
