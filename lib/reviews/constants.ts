// ─── Review system constants ─────────────────────────────────────────────────

export const REVIEW_TAGS = [
  "Clean car",
  "Great service",
  "Punctual",
  "Good value",
  "Smooth pickup",
  "Friendly owner",
  "As described",
  "Would rent again",
] as const;

export const REPORT_REASONS = [
  "Fake review",
  "Offensive language",
  "Not a real customer",
  "Spam",
  "Irrelevant",
  "Other",
] as const;

export const DELETE_REASONS = [
  "Policy violation",
  "Spam",
  "Abusive content",
  "Fake review",
  "Other",
] as const;

/** Customers may edit a review within this window, until the owner replies. */
export const REVIEW_EDIT_WINDOW_DAYS = 7;
/** Owners may edit their reply within this window. */
export const REPLY_EDIT_WINDOW_HOURS = 48;
/** One review per booking; max reviews a customer can post per day. */
export const REVIEW_RATE_LIMIT_PER_DAY = 5;
/** Reports at or above this threshold auto-hide a review pending admin review. */
export const REPORT_AUTO_HIDE_THRESHOLD = 3;

export const REVIEW_RULES = {
  titleMax: 80,
  commentMin: 20,
  commentMax: 1500,
  replyMax: 500,
  maxPhotos: 5,
  maxPhotoBytes: 5 * 1024 * 1024,
  photoTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;
