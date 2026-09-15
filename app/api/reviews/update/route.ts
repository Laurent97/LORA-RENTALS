import { NextResponse } from "next/server";
import { getCallerProfile, getSupabaseAdmin } from "@/lib/supabase/admin";
import { updateReviewSchema } from "@/lib/reviews/validators";
import { moderateText } from "@/lib/reviews/moderation";
import { REVIEW_EDIT_WINDOW_DAYS } from "@/lib/reviews/constants";
import { audit, clientIp } from "@/lib/reviews/server";
import { reviewFromRow } from "@/lib/supabase/mappers";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

// POST /api/reviews/update — customer edits their own review.
// Allowed within 7 days, once, and only before the owner replies.
export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!sb || !caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = updateReviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const input = parsed.data;

  const { data: row } = await sb.from("reviews").select("*").eq("id", input.reviewId).maybeSingle();
  if (!row) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  if (row.customer_id !== caller.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (row.status === "removed") return NextResponse.json({ error: "This review was removed" }, { status: 422 });
  if (row.edit_count >= 1) return NextResponse.json({ error: "Reviews can only be edited once" }, { status: 422 });
  if (Date.now() - new Date(row.created_at).getTime() > REVIEW_EDIT_WINDOW_DAYS * 864e5) {
    return NextResponse.json({ error: `Reviews can only be edited within ${REVIEW_EDIT_WINDOW_DAYS} days` }, { status: 422 });
  }
  const { data: reply } = await sb.from("review_replies").select("id").eq("review_id", row.id).maybeSingle();
  if (reply) return NextResponse.json({ error: "This review can no longer be edited — the owner has replied" }, { status: 422 });

  const mod = moderateText(`${input.title ?? ""} ${input.comment}`);
  const status = mod.clean ? (row.status === "flagged" ? "published" : row.status) : "flagged";

  const { data: updated, error } = await sb
    .from("reviews")
    .update({
      rating: input.rating,
      title: input.title || null,
      comment: input.comment,
      photos: input.photos,
      tags: input.tags,
      status,
      flag_reason: mod.clean ? row.flag_reason : mod.reasons.join(","),
      edited_at: new Date().toISOString(),
      edit_count: row.edit_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .select("*, customer:users!customer_id(name), reply:review_replies(*, owner:users!owner_id(name))")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(sb, {
    reviewId: row.id,
    action: "edited",
    actorId: caller.id,
    actorRole: caller.role,
    oldValue: { rating: row.rating, title: row.title, comment: row.comment, photos: row.photos, tags: row.tags },
    newValue: { rating: input.rating, title: input.title, comment: input.comment, photos: input.photos, tags: input.tags },
    reason: mod.clean ? undefined : `auto-flagged: ${mod.reasons.join(",")}`,
    ip: clientIp(req),
  });
  return NextResponse.json({ ok: true, review: reviewFromRow(updated), flagged: !mod.clean });
}
