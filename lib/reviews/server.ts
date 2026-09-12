import type { SupabaseClient } from "@supabase/supabase-js";
import { replyFromRow, reviewFromRow, userFromRow, vehicleFromRow, bookingFromRow } from "@/lib/supabase/mappers";
import type { ReviewAuditAction } from "@/types";

// ─── Server-side review helpers (service role — API routes only) ────────────

export async function loadReviewBundle(sb: SupabaseClient, reviewId: string) {
  const { data: row } = await sb
    .from("reviews")
    .select("*, customer:users!customer_id(name), reply:review_replies(*, owner:users!owner_id(name))")
    .eq("id", reviewId)
    .maybeSingle();
  if (!row) return null;
  const review = reviewFromRow(row);
  const [{ data: v }, { data: b }, customer, owner] = await Promise.all([
    sb.from("vehicles").select("*").eq("id", review.vehicleId).maybeSingle(),
    sb.from("bookings").select("*").eq("id", review.bookingId).maybeSingle(),
    sb.from("users").select("*").eq("id", review.customerId).maybeSingle(),
    review.ownerId ? sb.from("users").select("*").eq("id", review.ownerId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return {
    review,
    vehicle: v ? vehicleFromRow(v) : null,
    booking: b ? bookingFromRow(b) : null,
    customer: customer ? userFromRow(customer) : null,
    owner: owner?.data ? userFromRow(owner.data) : null,
  };
}

export async function audit(
  sb: SupabaseClient,
  entry: {
    reviewId?: string;
    replyId?: string;
    action: ReviewAuditAction;
    actorId?: string;
    actorRole?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    reason?: string;
    ip?: string;
  }
) {
  const { error } = await sb.from("review_audit_log").insert({
    review_id: entry.reviewId ?? null,
    reply_id: entry.replyId ?? null,
    action: entry.action,
    actor_id: entry.actorId ?? null,
    actor_role: entry.actorRole ?? null,
    old_value: entry.oldValue ?? null,
    new_value: entry.newValue ?? null,
    reason: entry.reason ?? null,
    ip_address: entry.ip ?? null,
  });
  if (error) console.warn("review audit insert failed:", error.message);
}

export async function notifyUser(
  sb: SupabaseClient,
  userId: string,
  title: string,
  message: string,
  type: "review" | "system" = "review"
) {
  const { error } = await sb.from("notifications").insert({ user_id: userId, type, title, message });
  if (error) console.warn("notification insert failed:", error.message);
}

export const clientIp = (req: Request) =>
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || undefined;
