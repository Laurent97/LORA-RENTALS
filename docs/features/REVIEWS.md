# Review & Reply System

Complete review system for LORA RENTALS — customers review completed trips, owners reply once, admins moderate everything.

## Golden rule

**Only admins can delete** — reviews or replies. Customers can edit (once, within 7 days, until the owner replies). Owners can edit their reply within 48h. Nobody else deletes anything.

## Database (`supabase/seed.sql`)

| Table | Purpose |
|---|---|
| `reviews` | rating, title, comment, photos (jsonb), tags, status, flag state, edit tracking, helpful_count |
| `review_replies` | one reply per review (`unique (review_id)`), cascades on review delete |
| `review_helpful_votes` | one vote per user per review |
| `review_reports` | flag queue with pending/reviewed/dismissed/actioned status |
| `review_audit_log` | every action: created, edited, replied, flagged, hidden, restored, deleted… |

Review statuses: `published` → `flagged` → `hidden` → `removed` (or back to `published` on restore).

A trigger keeps `vehicles.rating` / `vehicles.review_count` in sync with published reviews on every insert/update/delete.

## RLS

- **Public** reads `published` reviews + their replies only.
- **Customers** insert for their own `completed` bookings; update within 7 days, once, until replied. No delete.
- **Owners** insert one reply on their own cars' published reviews; update within 48h. No delete.
- **Admins** full read + update + delete via `is_admin()`.
- **Helpful votes**: any signed-in user, one per review.
- **Reports**: parties (customer/owner/admin) insert; admins manage.
- **Audit log**: service-role writes, admin reads.

## API routes (`app/api/reviews/`)

All POST, all verify the caller via `getCallerProfile`, all write audit entries.

| Route | Who | What |
|---|---|---|
| `create` | customer | validates completed booking ownership, one-per-booking, 5/day rate limit, profanity/link/phone screen → `published` or `flagged` |
| `update` | customer | once, ≤7 days, before owner reply |
| `reply` | owner | one reply per review; `edit: true` edits within 48h |
| `flag` | parties | report → `flagged`; 3+ reports → auto-`hidden` |
| `helpful` | any user | toggle vote, recounts `helpful_count` |
| `admin-delete` | admin | hard delete (cascades reply) or `replyOnly`; requires reason + typing `DELETE` |
| `admin-hide` | admin | `hide` / `restore` / `dismiss_flags` |

## Service layer (`lib/reviews/`)

- `constants.ts` — windows, limits, tag/report/reason lists, `REVIEW_RULES`
- `validators.ts` — zod schemas shared by forms and routes
- `permissions.ts` — `canCreateReview`, `canEditReview`, `canReply`, `canEditReply`, `canDelete*` (admin only), `canFlag`, `canModerate`
- `moderation.ts` — profanity/link/phone/repeated-text screen
- `analytics.ts` — `ratingBreakdown`, `ownerStats`, `ratingTrend`
- `service.ts` — `reviewApi` client wrapper + Cloudinary unsigned upload
- `server.ts` — `loadReviewBundle`, `audit`, `notifyUser`, `clientIp`

## UI (`components/reviews/`)

`RatingStars` (display + interactive), `RatingBreakdown`, `ReviewCard` (reply block, helpful vote, report, edit, admin delete), `ReviewForm` (draft autosave, tags, photos, honesty checkbox), `ReplyForm`, `PhotoUploader` (drag & drop → Cloudinary), `FlagDialog`, `DeleteConfirmationModal` (reason + type DELETE), `ReviewFilters`, `ReviewList`.

## Pages

- `/dashboard/bookings/[id]/review` — create/edit form with trip summary + success state
- `/dashboard/reviews` — customer's reviews + pending-review prompts
- `/owner/reviews` — stats (avg, response rate, reply time), breakdown, filters, reply inline
- `/admin/reviews` — platform table: status, flags, hide/restore/dismiss, delete modal
- `/cars/[id]` — public section: breakdown + published reviews only

## Emails (15 templates, `lib/postmark/templates/reviews.ts`)

| Slug | Recipient |
|---|---|
| `review-request` | customer (sent with booking-completed) |
| `review-published-customer` | customer |
| `review-new-owner` | owner |
| `review-reply-customer` | customer |
| `review-flagged-admin` | admins |
| `review-auto-hidden-admin` | admins |
| `review-hidden-customer` / `review-hidden-owner` | parties |
| `review-deleted-customer` / `review-deleted-owner` | parties |
| `reply-deleted-owner` | owner |
| `review-restored-customer` | customer |
| `review-reminder` | customer (48h nudge, via `review.reminder` event) |
| `review-weekly-digest-owner` | owner (cron/scheduled) |
| `review-milestone-owner` | owner (cron/scheduled) |

Events: `review.request`, `review.published`, `review.replied`, `review.flagged`, `review.hidden`, `review.restored`, `review.deleted`, `review.reply_deleted`, `review.reminder`, `review.weekly_digest`, `review.milestone` — dispatched from the API routes and `booking.completed`.

## Env

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` + `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — review photo uploads (unsigned preset, folder `lora/reviews`). Without them the uploader shows a config hint.
