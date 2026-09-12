import type { Booking, Review, ReviewReply, User } from "@/types";
import { REPLY_EDIT_WINDOW_HOURS, REVIEW_EDIT_WINDOW_DAYS } from "./constants";

// ─── Role-based permission checks ────────────────────────────────────────────
// Mirrors the RLS policies in supabase/seed.sql — used for UI gating and as a
// second enforcement layer inside the API routes. Golden rule: only admins
// can delete; customers can edit (before reply, within window) but never
// delete; owners can edit their reply (within window) but never delete.

export const canCreateReview = (user: User | null, booking: Booking | undefined, existing?: Review) =>
  !!user &&
  user.role === "customer" &&
  !!booking &&
  booking.customerId === user.id &&
  booking.status === "completed" &&
  !existing;

export const canEditReview = (user: User | null, review: Review): boolean => {
  if (!user || user.id !== review.customerId) return false;
  if (review.reply) return false; // locked once the owner replies
  if (review.editCount >= 1) return false;
  const ageMs = Date.now() - new Date(review.createdAt).getTime();
  return ageMs <= REVIEW_EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
};

/** Nobody but an admin deletes a review — not even its author. */
export const canDeleteReview = (user: User | null, _review?: Review) => user?.role === "admin";

export const canReply = (user: User | null, review: Review): boolean =>
  !!user && user.role === "owner" && review.ownerId === user.id && review.status === "published" && !review.reply;

export const canEditReply = (user: User | null, reply: ReviewReply | undefined): boolean => {
  if (!user || !reply || user.id !== reply.ownerId) return false;
  const ageMs = Date.now() - new Date(reply.createdAt).getTime();
  return ageMs <= REPLY_EDIT_WINDOW_HOURS * 60 * 60 * 1000;
};

/** Nobody but an admin deletes a reply — not even its author. */
export const canDeleteReply = (user: User | null, _reply?: ReviewReply) => user?.role === "admin";

export const canFlag = (user: User | null, review: Review): boolean =>
  !!user && (user.role === "admin" || user.id === review.customerId || user.id === review.ownerId);

export const canModerate = (user: User | null) => user?.role === "admin";

export const canViewReview = (user: User | null, review: Review): boolean =>
  review.status === "published" ||
  !!user && (user.role === "admin" || user.id === review.customerId || user.id === review.ownerId);

/** Milliseconds remaining in the customer's edit window (0 = expired). */
export const reviewEditWindowLeft = (review: Review): number =>
  Math.max(0, new Date(review.createdAt).getTime() + REVIEW_EDIT_WINDOW_DAYS * 864e5 - Date.now());

export const replyEditWindowLeft = (reply: ReviewReply): number =>
  Math.max(0, new Date(reply.createdAt).getTime() + REPLY_EDIT_WINDOW_HOURS * 36e5 - Date.now());
