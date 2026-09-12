import { NextResponse } from "next/server";
import { getCallerProfile, getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// POST /api/reviews/helpful { reviewId } — toggle a "helpful" vote.
export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!sb || !caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reviewId = (await req.json().catch(() => null))?.reviewId;
  if (!reviewId) return NextResponse.json({ error: "`reviewId` is required" }, { status: 400 });

  const { data: existing } = await sb
    .from("review_helpful_votes")
    .select("id")
    .eq("review_id", reviewId)
    .eq("user_id", caller.id)
    .maybeSingle();

  let voted: boolean;
  if (existing) {
    await sb.from("review_helpful_votes").delete().eq("id", existing.id);
    voted = false;
  } else {
    const { error } = await sb.from("review_helpful_votes").insert({ review_id: reviewId, user_id: caller.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    voted = true;
  }

  const { count } = await sb
    .from("review_helpful_votes")
    .select("id", { count: "exact", head: true })
    .eq("review_id", reviewId);
  await sb.from("reviews").update({ helpful_count: count ?? 0 }).eq("id", reviewId);
  return NextResponse.json({ ok: true, helpfulCount: count ?? 0, voted });
}
