import { z } from "zod";
import { REPORT_REASONS, REVIEW_RULES, REVIEW_TAGS } from "./constants";

// ─── Zod schemas — shared by the client form and the API routes ─────────────

export const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(REVIEW_RULES.titleMax).optional().or(z.literal("")),
  comment: z
    .string()
    .trim()
    .min(REVIEW_RULES.commentMin, `Please write at least ${REVIEW_RULES.commentMin} characters`)
    .max(REVIEW_RULES.commentMax),
  photos: z.array(z.string().url()).max(REVIEW_RULES.maxPhotos).default([]),
  tags: z
    .array(z.string())
    .max(REVIEW_TAGS.length)
    .default([])
    .transform((tags) => tags.filter((t) => (REVIEW_TAGS as readonly string[]).includes(t))),
  confirmed: z.literal(true, { errorMap: () => ({ message: "Please confirm this is your honest experience" }) }),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = z.object({
  reviewId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(REVIEW_RULES.titleMax).optional().or(z.literal("")),
  comment: z.string().trim().min(REVIEW_RULES.commentMin).max(REVIEW_RULES.commentMax),
  photos: z.array(z.string().url()).max(REVIEW_RULES.maxPhotos).default([]),
  tags: z.array(z.string()).max(REVIEW_TAGS.length).default([]),
});
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;

export const replySchema = z.object({
  reviewId: z.string().min(1),
  comment: z.string().trim().min(2).max(REVIEW_RULES.replyMax),
});
export type ReplyInput = z.infer<typeof replySchema>;

export const flagSchema = z.object({
  reviewId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(500).optional().or(z.literal("")),
});
export type FlagInput = z.infer<typeof flagSchema>;

export const adminDeleteSchema = z.object({
  reviewId: z.string().min(1),
  replyOnly: z.boolean().default(false),
  reason: z.string().trim().min(3, "A reason is required"),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  confirm: z.literal("DELETE", { errorMap: () => ({ message: 'Type "DELETE" to confirm' }) }),
});
export type AdminDeleteInput = z.infer<typeof adminDeleteSchema>;

export const adminModerateSchema = z.object({
  reviewId: z.string().min(1),
  action: z.enum(["hide", "restore", "dismiss_flags"]),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});
export type AdminModerateInput = z.infer<typeof adminModerateSchema>;
