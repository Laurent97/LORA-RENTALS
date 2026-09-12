# LORA RENTALS — Postmark Email System

75 transactional + broadcast templates sharing one master layout: navy header with the gold shield + live-text wordmark, gold accent bar, white body, silver footer. Mobile-responsive (600 → 320px), dark-mode aware (`prefers-color-scheme`), WCAG AA contrast, plain-text fallback for every message.

## Layout

```
lib/postmark/
├── config.ts              brand/env: from, reply-to, phone +250 787 988 039, lorarentals.org
├── i18n.ts                EN / RW / FR chrome + shared phrases
├── types.ts               EmailTemplate, SendOptions, EmailLogRow
├── client.ts              Postmark REST client (fetch, zero deps)
├── render.ts              renderEmail(slug, data, locale) — pure
├── send.ts                sendEmail() — idempotency, rate limit, retry, email_logs
├── index.ts               public exports
├── layout/
│   ├── styles.ts          theme tokens + <head> CSS (resets, dark mode, mobile)
│   ├── components.ts      button, otpBlock, infoCard, badge, alert, timeline, stats, qrImage…
│   ├── header.ts / footer.ts / base-layout.ts
│   └── text.ts            htmlToText() + text frame
└── templates/
    ├── auth.ts (17)  bookings.ts (17)  payments.ts (6)  owner.ts (7)  loyalty.ts (5)
    ├── admin.ts (7)  disputes.ts (5)   inspections.ts (3)  corporate.ts (3)  marketing.ts (5)
    └── registry.ts   templates, templateSlugs, getTemplate()
```

## Sending

```ts
import { sendEmail } from "@/lib/postmark";

await sendEmail({
  to: user.email,
  templateSlug: "booking-confirmed",
  data: { first_name, booking_id, car_name, car_image_url, pickup_location, return_location,
          pickup_date, return_date, days, total_rwf, total_usd, owner_name, booking_url },
  userId: user.id,
  locale: user.locale,               // "en" | "rw" | "fr"
  idempotencyKey: `booking-confirmed:${booking.id}`,
});
```

`sendEmail` never throws for delivery problems — check `result.ok` / `result.status` (`sent | skipped | failed`).

- **Idempotency** — same `idempotencyKey` is never sent twice (checked in `email_logs`, backed by a partial unique index).
- **Rate limit** — max 10 emails / minute / recipient.
- **Retry** — 3 attempts, exponential backoff, only on 5xx / 429.
- **No token** — with `POSTMARK_SERVER_TOKEN` unset, emails are rendered + logged as `skipped` (safe for dev/preview).
- **Audit** — every send is a row in `email_logs`; webhook events land in `email_events` and advance the log status (`sent → delivered → opened → clicked`, or `bounced` / `spam`).

Each template's `sample` data doubles as its type: `TemplateDataFor<"booking-confirmed">`.

## Authentication + email verification flow

Supabase Auth issues and validates the 8-digit codes, but **every email is sent by Postmark** — `POST /api/auth/otp` calls `admin.generateLink` (which creates the user/token without emailing anything) and delivers the code through our branded `auth-otp-*` templates. Supabase's built-in mailer is never invoked, and verification is enforced regardless of the project's "Confirm email" toggle.

```
/register ── POST /api/auth/otp {kind:"signup"} ──► generateLink(signup) creates
   │        unconfirmed user + Postmark "auth-otp-signup" ──► /verify?type=signup
/verify ── verifyOtp(email, code, type) ──► profile created from pendingProfile / metadata
   │      ──► referral (?ref=) attached ──► user.registered emails ──► dashboard
   └─ resend (60s cooldown, 45s server throttle) · type=recovery → set new password
/login ── signInWithPassword
   │  "Email not confirmed" ──► resend signup code ──► /verify?type=signup
   │  wrong password ──► error (NO mock fallback when Supabase is configured)
   ├─ "Email me a code" ──► /api/auth/otp {kind:"login"} ──► /verify?type=email
   └─ "Forgot password?" ──► /api/auth/otp {kind:"recovery"} ──► /verify?type=recovery ──► updateUser
```

Store: `register()` → `{status:"done"|"verify"|"error"}`, `login()` → `{status:"ok"|"unconfirmed"|"error"}`, plus `verifyOtp`, `resendOtp`, `sendLoginCode`, `sendPasswordReset`, `updatePassword`. Demo-account shortcuts and the mock login only exist when `NEXT_PUBLIC_SUPABASE_URL` is absent.

Notes:
- Signup resends generate a **magiclink** token (no password needed) — the API returns `verifyType:"email"` and `/verify` switches accordingly.
- Login/recovery requests for unknown emails return `ok` silently (anti-enumeration).
- `POST /api/auth/otp` is public but throttled: one code email per address per 45s, plus the global per-recipient rate limit in `sendEmail`.

## Triggers (wired)

Client store actions fire `notifyEmail(event, id)` (`lib/postmark/notify-client.ts`) **after** the Supabase write resolves. `POST /api/email/notify` verifies the caller's session, then `lib/postmark/triggers.ts` loads every entity server-side (never trusts client data), checks the caller is a party to it, and fans out with per-recipient locale + idempotency keys. In mock mode (no Supabase) it no-ops.

| Store action | Event | Emails |
|---|---|---|
| `register` | `user.registered` | `auth-welcome-success` (+ `owner-welcome` for owners), `admin-new-user` → admins |
| `addBooking` | `booking.requested` | `booking-request-sent` → customer, `booking-new-request-owner` → owner, `admin-new-booking` → admins |
| `updateBookingStatus(confirmed)` | `booking.confirmed` | `booking-confirmed` → customer, `booking-confirmed-owner` → owner |
| `…(declined)` | `booking.declined` | `booking-declined` → customer |
| `…(cancelled)` | `booking.cancelled` | by owner → `booking-cancelled-owner` to customer; by customer → `booking-cancelled-customer` to owner |
| `…(picked_up)` / `confirmPickup` | `booking.picked_up` | `booking-picked-up` → customer |
| `…(completed)` | `booking.completed` | `booking-completed` + `loyalty-points-earned` → customer |
| `updateUserKyc(verified/rejected)` | `user.kyc_approved/rejected` | `auth-kyc-approved` / `auth-kyc-rejected` |
| `updateVehicleStatus(pending→available)` | `vehicle.approved` | `owner-listing-approved` → owner |
| `addSos` | `sos.created` | `admin-sos-alert` → all admins (tag `sos`) |
| `addInspection` | `inspection.created` | `inspection-pickup-report` / `inspection-return-report` → customer + owner |
| `updateCorporateStatus(approved)` | `corporate.approved` | `corporate-welcome` → contact |
| — (call when a referral is marked rewarded) | `referral.rewarded` | `referral-reward-earned` → referrer |

Server-side/cron callers (SLA warnings, reminders, daily summaries) can hit `/api/email/notify` or `/api/email/send` with the `x-email-secret` header.

## API routes

| Route | Auth | Purpose |
|---|---|---|
| `POST /api/email/send` | `x-email-secret` header **or** Supabase admin Bearer | Server-to-server send (DB webhooks, cron, edge functions) |
| `POST /api/email/webhook?token=…` | `POSTMARK_WEBHOOK_SECRET` (query or Basic auth) | Postmark Delivery / Bounce / SpamComplaint / Open / Click |
| `GET /api/email/preview/:slug?locale=rw&format=html\|text\|json` | open in dev; admin or `?secret=` in prod | Render with sample data. `:slug=_list` returns all slugs |
| `GET /api/email/logs?status=&template=&q=` | Supabase admin Bearer | Delivery log |
| `POST /api/email/logs { logId }` | Supabase admin Bearer | Resend from stored data |

Hard bounces and spam complaints set `users.email_suppressed = true`.

## Admin UI — `/admin/emails`

- **Templates** tab: category filter, search, EN/RW/FR switch, live iframe preview, plain-text view, *Send test with sample data*.
- **Logs** tab: search by recipient/subject, filter by status, one-click resend.

## Local preview

```bash
npx tsx scripts/render-email.mjs        # → .email-preview/index.html (all 75, EN)
npx tsx scripts/render-email.mjs rw     # Kinyarwanda chrome
node scripts/gen-email-assets.mjs       # regenerate public/email/icon-gold*.png
```

Upload the `.email-preview/*.html` files to Litmus / Email on Acid for client testing.

## Do I need to add templates in Postmark?

**No.** `sendEmail` renders the full HTML in-app and posts it to Postmark's `/email` endpoint, so nothing has to exist in Postmark's Templates UI. This is deliberate: data is dynamic, locale is per-recipient, and templates are version-controlled here.

**Optional mirror** — to see all templates in the Postmark dashboard (previews on real clients, spam score, team review):

```bash
# .env.local must contain POSTMARK_SERVER_TOKEN
npx tsx scripts/postmark-sync-templates.mjs --dry-run   # list create/update actions
npx tsx scripts/postmark-sync-templates.mjs             # push 1 layout + 75 templates
npx tsx scripts/postmark-sync-templates.mjs --locale fr # French chrome
```

It creates a Layout `lora-base-layout` (master frame with `{{{ @content }}}`) and one Standard template per slug (alias = slug, e.g. `booking-confirmed`), rendered with sample data. Re-run after editing any template — it upserts by alias. If you later want Postmark to render a template itself, call `POST /email/withTemplate` with `TemplateAlias` and a `TemplateModel`; the aliases already match.

## Postmark setup

1. Create server **LORA RENTALS**, streams `outbound` (transactional) and `broadcast` (marketing).
2. Add sender signature / verify domain **lorarentals.org**; publish the DKIM TXT and Return-Path CNAME Postmark gives you. Add SPF `v=spf1 a mx include:spf.mtasv.net ~all` and a DMARC record (`v=DMARC1; p=quarantine; rua=mailto:dmarc@lorarentals.org`).
3. Webhooks → `https://lorarentals.org/api/email/webhook?token=<POSTMARK_WEBHOOK_SECRET>` — enable Delivery, Bounce, Spam Complaint, Open, Click.
4. Set env vars (see `.env.example`). **Rotate the server token before production and keep it server-side only.**
5. Run `supabase/seed.sql` (adds `email_logs`, `email_events`, `users.email_suppressed`).

## Template catalog

**auth** — `auth-otp-signup` `auth-otp-login` `auth-otp-password-reset` `auth-otp-email-change-old` `auth-otp-email-change-new` `auth-otp-phone-verify` `auth-otp-resend` `auth-otp-locked` `auth-otp-expired` `auth-welcome-success` `auth-verify-reminder` `auth-login-alert` `auth-password-changed` `auth-email-changed` `auth-account-locked` `auth-kyc-approved` `auth-kyc-rejected`

**bookings** — `booking-request-sent` `booking-new-request-owner` `booking-confirmed` `booking-confirmed-owner` `booking-declined` `booking-cancelled-customer` `booking-cancelled-owner` `booking-reminder-24h` `booking-reminder-2h` `booking-picked-up` `booking-return-reminder` `booking-completed` `booking-receipt` `booking-qr-pickup` `booking-owner-sla-warning` `booking-sla-escalation` `booking-auto-cancelled`

**payments** — `payment-received-office` `payment-receipt-pdf` `payment-outstanding` `payment-refund-initiated` `payment-refund-completed` `payment-owner-payout`

**owner** — `owner-welcome` `owner-listing-approved` `owner-listing-rejected` `owner-earnings-summary` `owner-kyc-reminder` `owner-review-received` `owner-vehicle-maintenance`

**loyalty** — `loyalty-points-earned` `loyalty-tier-upgrade` `loyalty-points-expiring` `referral-invite-sent` `referral-reward-earned`

**admin** — `admin-new-booking` `admin-new-user` `admin-dispute-raised` `admin-sos-alert` `admin-daily-summary` `admin-weekly-report` `admin-sla-breach`

**disputes** — `dispute-opened` `dispute-update` `dispute-resolved` `support-ticket-created` `support-ticket-reply`

**inspections** — `inspection-pickup-report` `inspection-return-report` `damage-claim-opened`

**corporate** — `corporate-welcome` `corporate-monthly-invoice` `corporate-member-invite`

**marketing** (broadcast stream, unsubscribe link) — `marketing-welcome-series-1` `marketing-weekly-deals` `marketing-blog-digest` `marketing-birthday` `marketing-reengagement`

## Adding a template

```ts
// lib/postmark/templates/<category>.ts
"my-slug": defineTemplate({
  name: "Human name", category: "bookings",
  subject: (d) => `… ${d.thing}`,
  preheader: () => "…",
  sample: { first_name: "Aline", thing: "x" },   // also the data type
  html: (d, t) => [greeting(t, d.first_name), p("…"), button("CTA →", url("/…")), signature(t)].join(""),
}),
```

It's picked up by the registry, preview route, and admin gallery automatically.
