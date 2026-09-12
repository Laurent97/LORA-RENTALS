import { NextResponse } from "next/server";
import { getCallerProfile, getSupabaseAdmin } from "@/lib/supabase/admin";
import { flagSchema } from "@/lib/reviews/validators";
import { REPORT_AUTO_HIDE_THRESHOLD } from "@/lib/reviews/constants";
import { audit, clientIp, notifyUser } from "@/lib/reviews/server";
import { dispatchEmailEvent } from "@/lib/postmark/triggers";

export const runtime = "nodejs";

// POST /api/reviews/flag — customer, owner or admin reports a review.
// At REPORT_AUTO_HIDE_THRESHOLD reports the review is auto-hidden pending admin review.
export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!sb || !caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = flagSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const input = parsed.data;

  const { data: review } = await sb.from("reviews").select("*").eq("id", input.reviewId).maybeSingle();
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  const isParty = caller.role === "admin" || review.customer_id === caller.id || review.owner_id === caller.id;
  if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const flaggedBy: string[] = review.flagged_by ?? [];
  if (flaggedBy.includes(caller.id)) return NextResponse.json({ error: "You already reported this review" }, { status: 409 });

  const { error: repErr } = await sb.from("review_reports").insert({
    review_id: review.id,
    reported_by: caller.id,
    reason: input.reason,
    details: input.details || null,
  });
  if (repErr) return NextResponse.json({ error: repErr.message }, { status: 500 });

  const nextFlags = [...flaggedBy, caller.id];
  const autoHide = nextFlags.length >= REPORT_AUTO_HIDE_THRESHOLD;
  const nextStatus = autoHide ? "hidden" : "flagged";
  const { error: upErr } = await sb
    .from("reviews")
    .update({
      flagged_by: nextFlags,
      flag_reason: input.reason,
      status: review.status === "published" ? nextStatus : review.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", review.id);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  await audit(sb, {
    reviewId: review.id,
    action: "flagged",
    actorId: caller.id,
    actorRole: caller.role,
    newValue: { reason: input.reason, flagCount: nextFlags.length, autoHidden: autoHide },
    reason: input.reason,
    ip: clientIp(req),
  });

  // Notify admins.
  const { data: admins } = await sb.from("users").select("id").eq("role", "admin").limit(10);
  for (const a of admins ?? []) {
    await notifyUser(sb, a.id, "🚩 Review flagged", `"${input.reason}" — ${nextFlags.length} report(s)${autoHide ? ", auto-hidden" : ""}.`);
  }
  return NextResponse.json({ ok: true, flagged: true, autoHidden: autoHide });
}
