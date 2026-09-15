# LORA RENTALS LTD — Platform Guide

This guide explains how the LORA platform works for the four main user types: customers, vehicle owners, corporate accounts, and multi-tenant country operators.

---

## 1. Customers

### Browse and book
- Visit `/browse` to see approved vehicles in the active country.
- Filter by location, car type, fuel, transmission, and price range.
- Click a vehicle to open its detail page at `/cars/{id}`.
- Select rental mode where available:
  - **Self-drive** — you drive the car.
  - **With driver** — a vetted LORA driver is assigned.
- Pick dates, pickup/return locations, and any add-ons.
- Confirm the booking and pay with cash, MTN MoMo, card, or use your LORA Wallet balance.

### Track your trip
- Once the trip is active, the owner or driver can share a live tracking link (`/track/{token}`).
- The tracking page shows the current vehicle location, route, alerts, and SOS status.

### After the trip
- Customers receive receipts at `/api/receipts/{bookingId}` and email copies.
- Leave reviews from `/dashboard/bookings`.
- Earn LORA Points for completed trips, referrals, and challenges.
- Redeem points for partner perks in the Rewards Marketplace at `/rewards`.

### Wallet and loyalty
- Customers can top up the LORA Wallet from `/dashboard/wallet`.
- Wallet balance is shown in RWF or USD based on the currency toggle.
- Loyalty tier, points balance, badges, and challenges are shown on `/dashboard/loyalty` and `/gamification`.

### Insurance and extras
- Browse insurance tiers and roadside assistance plans at `/insurance`.
- EV-only trips can be planned using `/ev-fleet`.
- Chauffeur and guided tour packages are listed on `/tours`.
- Community car-sharing circles are shown on `/community`.

### KYC
- Customers must complete KYC at `/kyc` before they can rent high-value vehicles or become an owner.
- Upload a selfie, ID front/back, and an optional video.
- Admins approve the submission before the account is fully verified.

---

## 2. Vehicle Owners

### Register and list a vehicle
- Sign up as an owner and complete profile KYC from `/owner/profile`.
- Add vehicles from `/owner/fleet`.
- Each vehicle requires make, model, year, plate, type, seats, transmission, fuel, location, photos, and description.
- Choose the rental mode:
  - Self-drive only
  - With driver only
  - Both options
- For driver-included rentals, assign a driver from `/owner/drivers` and set separate self-drive / with-driver pricing.

### Manage drivers
- Owners add and manage drivers at `/owner/drivers`.
- Driver profiles include photo, languages, specialties, license number, expiry, and bio.
- Drivers remain in a pending verification status until an admin approves them.

### Bookings and availability
- View and manage booking requests at `/owner/bookings`.
- Update vehicle availability from `/owner/availability`.
- Use the `/scan` page to scan customer QR codes at pickup and return.

### Pricing rules
- Set dynamic pricing rules for each vehicle at `/owner/pricing/{vehicleId}`.
- Rules include weekend surcharge, high demand bump, long-rental discounts, early-bird and last-minute discounts, and high-demand date overrides.

### Earnings
- Track earnings and completed trips on `/owner/earnings`.
- Payouts are processed after the platform commission is applied.

---

## 3. Corporate Accounts

### Sign up and manage members
- Visit `/business` to learn about corporate rental benefits.
- Sign up a company account through `/business/signup`.
- Corporate admins invite members at `/corporate` and assign roles:
  - Admin
  - Manager
  - Member

### Booking and approvals
- Corporate members book trips using the corporate booking flow.
- Cost centers and approval chains control who can book and spend.
- Bulk bookings and monthly consolidated invoicing are supported.
- Purchase order (PO) numbers and approval statuses are attached to bookings.

### Invoicing
- Monthly invoices are generated at `/api/invoices/{invoiceId}` and displayed on `/corporate`.
- Corporate invoices include line items, subtotal, discount, VAT, total, due date, and payment status.
- Payment terms such as Net 15 and Net 30 are recorded per account.

### Policies and reporting
- Corporate booking policies define allowed vehicle types, locations, rental modes, and approval thresholds.
- Admins and managers can export reports and CSVs.

---

## 4. Multi-Tenant / Country Operators

### Country settings
- Each country has its own settings table: `country_settings`.
- Supported markets: Rwanda (RW), Kenya (KE), Uganda (UG), Tanzania (TZ), and DR Congo (CD).
- Admins manage per-country configuration from `/admin/tenants`:
  - Currency
  - Phone prefix
  - VAT rate
  - Booking fee
  - Active payment rails

### Data scoping
- The `users`, `vehicles`, and `bookings` tables include a `country` column.
- All public listings, pricing, and search results are scoped to the active country.
- A single Supabase project serves all countries while keeping tenant data isolated.

---

## 5. Admins

### Command center
- The admin dashboard at `/admin` gives an overview of users, vehicles, bookings, revenue, and alerts.

### Key admin tools
- **Vehicles** — approve, reject, or suspend vehicle listings.
- **Users** — manage roles, suspend, restore, or delete accounts.
- **KYC approvals** — review and approve driver and customer KYC submissions.
- **SOS alerts** — respond to in-trip emergency alerts.
- **Geofence alerts** — monitor out-of-country, restricted-zone, speed, and fuel alerts.
- **Corporate** — approve corporate accounts and manage members.
- **Tenants** — edit country-specific settings.
- **Emails** — preview and send system emails.
- **Blog CMS** — publish content for the marketing blog.
- **Settings** — platform-wide configuration.

### Documents and notifications
- Admins do not trigger emails that expose the 422 error state to users.
- Receipts, invoices, and official documents are generated at `/api/receipts/{id}` and `/api/invoices/{id}` with LORA branded HTML, status stamps, and printable layouts.

---

## 6. Common Workflows

### Customer rental flow
1. Browse vehicles.
2. Select car, dates, rental mode, and add-ons.
3. Pay or request booking.
4. Pick up the car (QR scan by owner).
5. Track trip in real time.
6. Return car and receive receipt.
7. Leave a review and earn points.

### Owner listing flow
1. Complete owner KYC.
2. Add vehicle from `/owner/fleet`.
3. Add drivers if offering chauffeur service.
4. Set pricing rules.
5. Vehicle is pending until admin approval.
6. Accept or decline incoming bookings.
7. Earn after completed trip.

### Corporate flow
1. Register company.
2. Add cost centers and invite members.
3. Set booking policies and approval thresholds.
4. Members request bookings.
5. Managers approve trips.
6. Receive monthly consolidated invoice.
7. Pay via bank transfer or MoMo.
