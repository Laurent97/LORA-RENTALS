# LORA RENTALS LTD 🚗🇷🇼

Premium private car booking platform for Rwanda. Customers browse & reserve cars
from verified owners — **no online booking fee, ever**. Payment happens at the
office or at pickup: **Cash · MTN MoMo · Card**.

## Tech stack

- **Next.js 14** (App Router) + TypeScript strict
- **Tailwind CSS** + shadcn-style UI primitives
- **Framer Motion** · **Lucide** icons · **Sonner** toasts
- **Zustand** (persisted auth, favorites, bookings, currency, all feature state)
- **React Hook Form + Zod** validation
- **Recharts** analytics
- **Supabase** (auth, Postgres, storage, RLS) with offline mock fallback
- **PWA** — installable, offline shell, service worker

## Quick start

```bash
npm install
npm run dev
# → http://localhost:3000
```

## PWA installation

The install experience waits for 20 seconds or 50% page scroll, then shows Android's native install dialog, an iOS Safari Add-to-Home-Screen guide, or a Chrome/Edge desktop card. Dismissals are capped for 7 days, then 30 days, then effectively permanently. Test with Chrome DevTools → Application → Manifest/Service Workers, using a production build or deployed HTTPS site.

Regenerate branded PNG assets after changing the icon artwork:

```bash
node scripts/gen-icons.mjs
```

Validate the manifest, generated assets, offline worker, and push handlers with:

```bash
npm run verify:pwa
```

Apply `supabase/migrations/202609130002_pwa.sql` to persist install analytics and push subscriptions. Set the VAPID variables in `.env.local`; a server-side sender (using `VAPID_PRIVATE_KEY`) is required to deliver notification payloads to saved subscriptions. Run Lighthouse against the deployed HTTPS URL, because installability and native prompts are unavailable on ordinary HTTP deployments.

To send a booking reminder from a trusted backend, POST `title`, `body`, `url`, and optionally a subscription `endpoint` to `/api/pwa/send`, with `x-push-secret` equal to `PUSH_API_SECRET`. Without an endpoint, the sender broadcasts to every saved subscription; use this only for platform-wide notices.

### Demo accounts (any password)

| Role     | Email             | Lands on      |
|----------|-------------------|---------------|
| Customer | `customer@lora.rw`| `/dashboard`  |
| Owner    | `owner@lora.rw`   | `/owner`      |
| Admin    | `admin@lora.rw`   | `/admin`      |

## Features (20)

| # | Feature | Where |
|---|---------|-------|
| 1 | AI natural-language search | Hero bar → `/api/ai-search` |
| 2 | Verified owner badge + KYC | `/admin/kyc`, car detail |
| 3 | QR-code pickup | `/scan`, booking QR |
| 4 | Availability calendar | Car detail, `/owner/availability` |
| 5 | Rwanda location autocomplete | Search bar, booking |
| 6 | Live multi-currency | Header toggle, `lib/rates.ts` |
| 7 | Dark mode | Header toggle |
| 8 | PWA (offline + install) | `sw.js`, `/offline`, prompt |
| 9 | WhatsApp integration | Float + car-detail CTA |
| 10 | Pay-at-pickup badge | Car cards |
| 11 | Loyalty points + tiers | `/dashboard/loyalty`, checkout |
| 12 | Referral program | `/dashboard/referrals`, `?ref=` |
| 13 | Damage/inspection reports | `/inspect/[bookingId]` |
| 14 | Trip timeline | Customer bookings |
| 15 | Owner SLA countdown | Owner bookings, car detail |
| 16 | Emergency SOS | Active trips, `/admin/sos` |
| 17 | i18n (EN/RW/FR) | Header switcher |
| 18 | Blog + CMS | `/blog`, `/admin/blog` |
| 19 | Corporate accounts | `/business`, `/corporate`, `/admin/corporate` |
| 20 | Airport pickup | `/airport`, homepage tile |

Full details in [`docs/features/README.md`](docs/features/README.md).

## Structure

```
app/
  page.tsx              landing (hero + AI search, featured, airport tile)
  browse/               filters: type, location, transmission, fuel, seats, price
  cars/[id]/            gallery, specs, availability, owner, reviews, reserve
  book/[id]/            4-step flow → QR pickup + loyalty redemption
  scan/                 QR pickup scanner (owner/admin)
  inspect/[bookingId]/  photo + signature inspection
  airport/              flight-tracked airport pickup
  business/ corporate/  corporate signup + dashboard
  blog/ blog/[slug]/    public blog
  offline/              PWA offline fallback
  login/ register/      auth (Supabase + mock fallback)
  dashboard/            customer: overview, bookings, favorites, loyalty, referrals, profile
  owner/                overview, fleet, bookings, availability, earnings
  admin/                command center, users, vehicles, bookings, kyc, sos, blog, corporate, settings
  api/                  ai-search, log-search
components/             ui/, layout/, feature components (see docs)
lib/                    constants, data (mock), store (zustand), i18n, rates, utils, supabase/
types/                  domain models
supabase/seed.sql       schema + RLS + seed data
scripts/gen-icons.mjs   PWA icon generator
docs/features/          per-feature documentation
```

## Plugging in real backends

### Supabase
1. `npm i @supabase/supabase-js @supabase/ssr`
2. Set env vars (see `.env.example`)
3. Run `supabase/seed.sql` in the SQL editor — creates all tables, RLS, and seed data
4. The store hydrates from Supabase automatically; mock data is the offline fallback

### AI search (optional)
Set `ANTHROPIC_API_KEY` to use the LLM parser. Without it, a rule-based parser handles the same queries.

### Postmark email (75 templates)
Set `POSTMARK_SERVER_TOKEN` (server-only) plus `SUPABASE_SERVICE_ROLE_KEY` for the audit log.
Preview any template at `/api/email/preview/<slug>` or in `/admin/emails`. Full guide: [`docs/features/EMAIL.md`](docs/features/EMAIL.md).

### Cloudinary
1. `npm i next-cloudinary`
2. Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` + upload preset
3. Swap the upload buttons (`owner/fleet`, `dashboard/profile`) for
   `CldUploadWidget`; store returned URLs in `vehicles.images[]`.

### Mapbox
1. `npm i mapbox-gl`
2. Set `NEXT_PUBLIC_MAPBOX_TOKEN`
3. Replace `components/map-placeholder.tsx` with a real map.

## Env vars

Copy `.env.example` → `.env.local` when wiring real services.

## Deploy

Vercel-ready: push to GitHub → import → deploy. No server secrets needed for the
mock build.

---

**Non-negotiable:** booking fee is `RWF 0` on every screen. Payments are only
ever collected at the office or at pickup.
