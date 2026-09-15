import { NextResponse } from "next/server";
import { getCallerProfile, getSupabaseAdmin } from "@/lib/supabase/admin";
import { adminModerateSchema } from "@/lib/reviews/validators";
import { audit, clientIp, loadReviewBundle, notifyUser } from "@/lib/reviews/server";
import { dispatchEmailEvent } from "@/lib/postmark/triggers";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

// POST /api/reviews/admin-hide — ADMIN ONLY moderation actions:
//   hide           → status 'hidden' (soft — stays in DB, hidden from public)
//   restore        → status 'published'
//   dismiss_flags  → clears flag state, back to 'published'
export async function POST(req: Request) {
  const sb = getSupabaseAdmin();
  const caller = await getCallerProfile(req.headers.get("authorization"));
  if (!sb || !caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (caller.role !== "admin") return NextResponse.json({ error: "Only admins can moderate reviews" }, { status: 403 });

  const parsed = adminModerateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const input = parsed.data;

  const bundle = await loadReviewBundle(sb, input.reviewId);
  if (!bundle) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  const { review, customer, owner } = bundle;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  let action: "hidden" | "restored" | "flags_dismissed";
  if (input.action === "hide") {
    patch.status = "hidden";
    patch.admin_note = input.note || null;
    action = "hidden";
  } else if (input.action === "restore") {
    patch.status = "published";
    patch.admin_note = input.note || null;
    action = "restored";
  } else {
    patch.status = "published";
    patch.flagged_by = [];
    patch.flag_reason = null;
    action = "flags_dismissed";
  }

  const { error } = await sb.from("reviews").update(patch).eq("id", review.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve pending reports when flags are dismissed or the review is hidden.
  if (input.action !== "restore") {
    await sb
      .from("review_reports")
      .update({ status: input.action === "hide" ? "actioned" : "dismissed", reviewed_by: caller.id, reviewed_at: new Date().toISOString() })
      .eq("review_id", review.id)
      .eq("status", "pending");
  }

  await audit(sb, {
    reviewId: review.id,
    action,
    actorId: caller.id,
    actorRole: "admin",
    oldValue: { status: review.status, flagCount: review.flagCount },
    newValue: { status: patch.status },
    reason: input.note || undefined,
    ip: clientIp(req),
  });

  if (input.action === "hide") {
    if (customer) await notifyUser(sb, customer.id, "Your review was hidden", "A LORA admin hid your review pending moderation.");
    if (owner) await notifyUser(sb, owner.id, "A review was hidden", "A review on your vehicle was hidden by LORA admin.");
    await dispatchEmailEvent({ event: "review.hidden", id: review.id, actor: { id: caller.id, role: "admin" }, meta: { reason: input.note || "Moderation" } });
  } else if (input.action === "restore") {
    await dispatchEmailEvent({ event: "review.restored", id: review.id, actor: { id: caller.id, role: "admin" } });
  }
  return NextResponse.json({ ok: true, status: patch.status });
}
