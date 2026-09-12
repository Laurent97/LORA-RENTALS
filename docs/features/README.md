# LORA RENTALS — Feature Documentation

All 20 features are fully integrated: UI, data model, state, and Supabase sync.

## Data model

New tables in `supabase/seed.sql` (all idempotent, all with RLS):

| Table | Feature |
|---|---|
| `search_queries` | F1 AI search analytics |
| `vehicle_availability` | F4 owner-blocked dates |
| `locations` | F5 curated Rwanda places |
| `loyalty_points` + `points_transactions` | F11 loyalty |
| `referrals` | F12 referral |
| `inspections` | F13 damage reports |
| `sos_alerts` | F16 emergency SOS |
| `posts` | F18 blog CMS |
| `corporate_accounts` + `corporate_members` + `invoices` | F19 corporate |
| `airport_bookings` | F20 airport pickup |
| `currency_preferences` | F6 currency persist |

Column additions: `users.referral_code`, `users.avg_response_minutes`, `vehicles.payment_methods`, `vehicles.airport_approved`, `bookings.qr_token`, `bookings.picked_up_at`, `bookings.returned_at`, `bookings.owner_responded_at`, `bookings.owner_response_deadline`.

## Features

### F1 — AI Search
`POST /api/ai-search` parses natural language ("4x4 in Musanze next weekend") into filters. Uses Anthropic when `ANTHROPIC_API_KEY` is set, otherwise a rule-based parser. Results shown as removable "AI understood" chips; navigates to `/browse` with filters applied. Queries logged to `search_queries` via `/api/log-search`.

### F2 — Verified Owner Badge
`components/verified-badge.tsx` — blue check with tooltip. Admin approves KYC at `/admin/kyc`; verified owners show the badge + response stats on car detail.

### F3 — QR Pickup
Every booking gets a `qr_token`. Customer shows the QR (encodes `LORA:{token}`) on the confirmation screen or `/dashboard/bookings`. Owner/admin scans at `/scan` — camera via `BarcodeDetector` with manual-entry fallback. Confirms pickup → `picked_up` + `picked_up_at`.

### F4 — Availability Calendar
`components/availability-calendar.tsx` — month grid showing booked (from active bookings) and owner-blocked (from `vehicle_availability`) dates. View mode on car detail; manage mode at `/owner/availability` lets owners tap to block/unblock.

### F5 — Location Autocomplete
`components/location-autocomplete.tsx` — keyboard-navigable dropdown sourced from the `locations` table (falls back to `RWANDA_LOCATIONS`). Wired into the search bar and booking pickup/return fields.

### F6 — Multi-Currency
`lib/rates.ts` fetches the live USD→RWF rate (open.er-api.com), caches 1h in localStorage. `formatMoney` reads it transparently. Preference persists to `currency_preferences` per user.

### F7 — Dark Mode
`next-themes` + `ThemeToggle` in the header. All new components use semantic tokens (`bg-card`, `text-muted-foreground`, `border-border`) so they adapt automatically.

### F8 — PWA
`public/manifest.json` + generated PNG icons (`scripts/gen-icons.mjs`), `public/sw.js` (offline shell + asset caching), `/offline` fallback page, `components/install-prompt.tsx` (shows after 2nd visit), `components/sw-register.tsx`.

### F9 — WhatsApp
`components/whatsapp-float.tsx` — floating button on every page (hidden on auth/scan). Car detail has a per-vehicle WhatsApp CTA. Number from `BRAND.whatsapp` in `lib/constants`.

### F10 — Pay-at-Pickup Badge
`components/pay-at-pickup-badge.tsx` — green chip with Cash/MoMo/Card icons driven by `vehicle.payment_methods`. On every car card.

### F11 — Loyalty
`/dashboard/loyalty` — balance, tier progress (Bronze→Platinum), transaction history. Earn 1 pt per RWF 1,000 on completion (auto in `updateBookingStatus`). Redeem at checkout — 1 pt = RWF 10 off, capped at 20%.

### F12 — Referral
`/dashboard/referrals` — code, shareable link, QR, stats. Code auto-generated on register. `?ref=` on `/register` creates the referral record; both sides earn RWF 10,000 on first completed rental.

### F13 — Damage Report
`/inspect/[bookingId]` — pickup/return inspection with photo upload (Supabase storage, data-URL fallback), fuel/odometer, notes, and dual signature pads (`components/signature-pad.tsx`). Linked from owner bookings at pickup/return stages.

### F14 — Trip Timeline
`components/trip-timeline.tsx` — horizontal/vertical stepper with real timestamps (`createdAt`, `ownerRespondedAt`, `pickedUpAt`, `returnedAt`). On customer bookings.

### F15 — Owner SLA
`components/sla-countdown.tsx` — live countdown to `owner_response_deadline` (4h) on pending requests. Overdue → "escalated". `avg_response_minutes` drives the "Responds in ~Xmin" + ⚡ Fast Responder badge on car detail.

### F16 — Emergency SOS
`components/sos-button.tsx` — hold 3s to activate (visible only during `picked_up` trips). Captures GPS, writes to `sos_alerts`, opens WhatsApp to support. Admin panel at `/admin/sos` with acknowledge/resolve and map links.

### F17 — i18n
`lib/i18n.tsx` — EN/Kinyarwanda/French dictionaries, `useT()` hook, localStorage persistence. `components/language-switcher.tsx` in the header.

### F18 — Blog
`/blog` grid with category filters, `/blog/[slug]` article pages (markdown-lite renderer), `/admin/blog` CMS (create/edit/publish/draft). Seed posts in `lib/data.ts`.

### F19 — Corporate
`/business` landing + application form → `corporate_accounts` (pending). `/corporate` dashboard — team, trips, spend, invoices. Admin approves at `/admin/corporate`.

### F20 — Airport Pickup
`/airport` — flight-number flow, meet & greet toggle (+RWF 15,000), airport-approved fleet only. Homepage tile links to it. Creates a `Booking` + `airport_bookings` row.

## Store actions

`lib/store.ts` exposes: `setAvailability`, `earnPoints`, `redeemPoints`, `addReferral`, `addInspection`, `addSos`, `updateSosStatus`, `addPost`, `updatePost`, `addCorporateAccount`, `updateCorporateStatus`, `addAirportBooking`, `updateUserKyc`, `updateVehicleStatus`, `confirmPickup`. Each updates local state then syncs to Supabase.
