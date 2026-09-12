// ─── LORA RENTALS LTD — Supabase seed script ─────────────────────────────────
// Usage: node scripts/seed.mjs
// 1. Applies supabase/seed.sql (tables + RLS) via direct Postgres connection
// 2. Creates auth users via the admin API (password: demo1234)
// 3. Upserts profiles, vehicles, bookings, reviews (real UUIDs)
// 4. Ensures the "lorarentals" storage bucket exists (public)

import { createClient } from "@supabase/supabase-js";
import pg from "pg";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// ── minimal .env.local loader ────────────────────────────────────────────────
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !line.trim().startsWith("#")) process.env[m[1]] ??= m[2];
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !SERVICE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const DEMO_PASSWORD = "demo1234";

// ── 1. schema ────────────────────────────────────────────────────────────────
console.log("→ Applying schema (supabase/seed.sql)…");
const db = new pg.Client({
  host: process.env.SUPABASE_DB_HOST,
  user: process.env.SUPABASE_DB_USER,
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME,
  port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
  ssl: { rejectUnauthorized: false },
});
await db.connect();
await db.query(readFileSync(join(root, "supabase/seed.sql"), "utf8"));
await db.end();
console.log("  ✓ schema + RLS applied");

const sb = createClient(URL, SERVICE, { auth: { persistSession: false } });

// ── 2. storage bucket ────────────────────────────────────────────────────────
const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "lorarentals";
const { error: bucketErr } = await sb.storage.createBucket(bucket, { public: true });
console.log(bucketErr ? `  · bucket "${bucket}": ${bucketErr.message}` : `  ✓ bucket "${bucket}" public`);

// ── 3. auth users ────────────────────────────────────────────────────────────
// mockId → profile (mirrors lib/data.ts)
const USERS = [
  { key: "own-1", role: "owner", name: "Jean-Bosco Mugisha", email: "owner@lora.rw", phone: "+250 788 111 222", kyc_status: "verified", business_name: "Mugisha Motors", payout_method: "momo", payout_details: "+250 788 111 222" },
  { key: "own-2", role: "owner", name: "Aline Uwase", email: "aline@lorarentals.rw", phone: "+250 788 333 444", kyc_status: "verified", business_name: "Uwase Fleet", payout_method: "bank", payout_details: "BK ****4521" },
  { key: "own-3", role: "owner", name: "Eric Nshimiyimana", email: "eric@lorarentals.rw", phone: "+250 788 555 666", kyc_status: "verified", business_name: "Kigali 4x4 Co.", payout_method: "momo", payout_details: "+250 788 555 666" },
  { key: "own-4", role: "owner", name: "Claudine Mukamana", email: "claudine@lorarentals.rw", phone: "+250 788 777 888", kyc_status: "pending", business_name: "CM Rentals", payout_method: null, payout_details: null },
  { key: "own-5", role: "owner", name: "Patrick Habimana", email: "patrick@lorarentals.rw", phone: "+250 788 999 000", kyc_status: "verified", business_name: "Habimana Auto", payout_method: "momo", payout_details: "+250 788 999 000" },
  { key: "cus-1", role: "customer", name: "Diane Ingabire", email: "customer@lora.rw", phone: "+250 788 100 200", kyc_status: "verified", business_name: null, payout_method: null, payout_details: null },
  { key: "cus-2", role: "customer", name: "Samuel Nkurunziza", email: "samuel@example.rw", phone: "+250 788 300 400", kyc_status: "verified", business_name: null, payout_method: null, payout_details: null },
  { key: "cus-3", role: "customer", name: "Grace Umutoni", email: "grace@example.rw", phone: "+250 788 500 600", kyc_status: "pending", business_name: null, payout_method: null, payout_details: null },
  { key: "adm-1", role: "admin", name: "LORA Admin", email: "admin@lora.rw", phone: "+250 788 000 000", kyc_status: "verified", business_name: null, payout_method: null, payout_details: null },
];

console.log("→ Creating auth users…");
const uid = {}; // mockId → auth uuid
for (const u of USERS) {
  const { data, error } = await sb.auth.admin.createUser({
    email: u.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (error) {
    // already registered → look up existing id
    const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
    const existing = list?.users?.find((x) => x.email === u.email);
    if (!existing) {
      console.error(`  ✗ ${u.email}: ${error.message}`);
      process.exit(1);
    }
    uid[u.key] = existing.id;
    console.log(`  · ${u.email} already exists`);
  } else {
    uid[u.key] = data.user.id;
    console.log(`  ✓ ${u.email}`);
  }
}

// ── 4. profiles ──────────────────────────────────────────────────────────────
// Clean slate: remove dependent rows first (FK order), then stale profiles
// left over from earlier seed runs (same emails, different UUIDs).
console.log("→ Clearing old rows…");
const NIL = "00000000-0000-0000-0000-000000000000";
await sb.from("reviews").delete().neq("id", NIL);
await sb.from("bookings").delete().neq("id", NIL);
await sb.from("vehicles").delete().neq("id", NIL);
await sb.from("users").delete().in("email", USERS.map((u) => u.email));

console.log("→ Upserting profiles…");
const { error: usersErr } = await sb.from("users").upsert(
  USERS.map((u) => ({
    id: uid[u.key],
    role: u.role,
    name: u.name,
    email: u.email,
    phone: u.phone,
    kyc_status: u.kyc_status,
    business_name: u.business_name,
    payout_method: u.payout_method,
    payout_details: u.payout_details,
  }))
);
if (usersErr) { console.error("  ✗ users:", usersErr.message); process.exit(1); }
console.log(`  ✓ ${USERS.length} profiles`);

// ── 5. vehicles ──────────────────────────────────────────────────────────────
const img = (id) => `https://images.unsplash.com/${id}?f_auto&q_auto&w_1600`;
const VEHICLES = [
  { key: "veh-1", owner: "own-1", make: "Toyota", model: "Land Cruiser V8", year: 2022, plate: "RAE 412 B", type: "4x4", transmission: "automatic", fuel: "diesel", seats: 7, price_per_day: 150000, location: "Kigali — Gasabo", lat: -1.9355, lng: 30.0975, images: [img("photo-1568844293986-8d0400bd4745"), img("photo-1533473359331-0135ef1b58bf"), img("photo-1519641471654-76ce0107ad1b")], features: ["4WD", "Air Conditioning", "GPS Navigation", "Leather Seats", "Roof Rack", "Reverse Camera"], description: "Flagship Land Cruiser built for Rwanda's hills and national parks. Ideal for Akagera safaris and Volcanoes gorilla treks.", status: "available", verified: true, rating: 4.9, review_count: 87, trips_completed: 132 },
  { key: "veh-2", owner: "own-2", make: "Mercedes-Benz", model: "E-Class", year: 2021, plate: "RAF 208 C", type: "luxury", transmission: "automatic", fuel: "petrol", seats: 5, price_per_day: 120000, location: "Kigali — Nyarugenge", lat: -1.9501, lng: 30.0588, images: [img("photo-1618843479313-40f8afb4b4d8"), img("photo-1617531653332-bd46c24f2068")], features: ["Leather Seats", "Sunroof", "Apple CarPlay", "Cruise Control", "Air Conditioning"], description: "Executive E-Class for business travel and special occasions. Chauffeur option available.", status: "available", verified: true, rating: 4.8, review_count: 54, trips_completed: 78 },
  { key: "veh-3", owner: "own-1", make: "Toyota", model: "RAV4", year: 2023, plate: "RAG 915 D", type: "suv", transmission: "automatic", fuel: "hybrid", seats: 5, price_per_day: 75000, location: "Kigali — Kicukiro", lat: -1.9706, lng: 30.1044, images: [img("photo-1621007947382-bb3c3994e3fb"), img("photo-1580273916550-e323be2ae537")], features: ["Air Conditioning", "Bluetooth", "Reverse Camera", "Apple CarPlay", "Cruise Control"], description: "Fuel-sipping hybrid RAV4 — perfect city runabout that still handles upcountry roads with ease.", status: "available", verified: true, rating: 4.7, review_count: 112, trips_completed: 201 },
  { key: "veh-4", owner: "own-3", make: "Toyota", model: "Hilux Double Cab", year: 2022, plate: "RAE 677 E", type: "pickup", transmission: "manual", fuel: "diesel", seats: 5, price_per_day: 90000, location: "Musanze", lat: -1.4998, lng: 29.6350, images: [img("photo-1559416523-140ddc3d238c"), img("photo-1535732820275-9ffd998cac22")], features: ["4WD", "Roof Rack", "Air Conditioning", "Bluetooth", "Dash Cam"], description: "Workhorse Hilux based in Musanze — the go-to for gorilla trekking crews and construction sites.", status: "available", verified: true, rating: 4.6, review_count: 63, trips_completed: 95 },
  { key: "veh-5", owner: "own-2", make: "Toyota", model: "Corolla", year: 2021, plate: "RAF 331 F", type: "sedan", transmission: "automatic", fuel: "petrol", seats: 5, price_per_day: 45000, location: "Kigali — Gasabo", lat: -1.9297, lng: 30.1127, images: [img("photo-1623869675781-80aa31012a5a"), img("photo-1590362891991-f776e747a588")], features: ["Air Conditioning", "Bluetooth", "USB Charging", "Reverse Camera"], description: "Reliable, economical Corolla — the smart choice for city errands and airport runs.", status: "available", verified: true, rating: 4.5, review_count: 148, trips_completed: 264 },
  { key: "veh-6", owner: "own-3", make: "Land Rover", model: "Defender 110", year: 2023, plate: "RAG 044 G", type: "4x4", transmission: "automatic", fuel: "diesel", seats: 7, price_per_day: 180000, location: "Rubavu", lat: -1.6794, lng: 29.2668, images: [img("photo-1606016159991-dfe4f2746ad5"), img("photo-1568605117036-5fe5e7bab0b7")], features: ["4WD", "Leather Seats", "GPS Navigation", "Roof Rack", "360 Camera", "Air Conditioning"], description: "Iconic Defender stationed in Rubavu — Lake Kivu weekends and Congo-Nile trail adventures.", status: "available", verified: true, rating: 4.9, review_count: 41, trips_completed: 58 },
  { key: "veh-7", owner: "own-5", make: "Toyota", model: "Hiace", year: 2020, plate: "RAD 552 H", type: "minivan", transmission: "manual", fuel: "diesel", seats: 14, price_per_day: 85000, location: "Huye", lat: -2.5967, lng: 29.7389, images: [img("photo-1570125909232-eb263c188f7e"), img("photo-1544620347-c4fd4a3d5957")], features: ["Air Conditioning", "USB Charging", "Bluetooth"], description: "14-seat Hiace for group travel, weddings, and corporate shuttles across the Southern Province.", status: "available", verified: true, rating: 4.4, review_count: 76, trips_completed: 143 },
  { key: "veh-8", owner: "own-5", make: "Kia", model: "Sorento", year: 2022, plate: "RAF 890 J", type: "suv", transmission: "automatic", fuel: "diesel", seats: 7, price_per_day: 80000, location: "Kigali — Kicukiro", lat: -1.966, lng: 30.086, images: [img("photo-1619405399517-d7fce0f13302"), img("photo-1549317661-bd32c8ce0db2")], features: ["7 Seats", "Air Conditioning", "Apple CarPlay", "Reverse Camera", "Cruise Control"], description: "Spacious 7-seat Sorento — family trips to Akagera or cross-border runs made comfortable.", status: "available", verified: true, rating: 4.6, review_count: 59, trips_completed: 88 },
  { key: "veh-9", owner: "own-1", make: "BMW", model: "X5", year: 2022, plate: "RAE 123 K", type: "luxury", transmission: "automatic", fuel: "petrol", seats: 5, price_per_day: 140000, location: "Kigali — Gasabo", lat: -1.9441, lng: 30.0619, images: [img("photo-1555215695-3004980ad54e"), img("photo-1556189250-72ba954cfc2b")], features: ["Leather Seats", "Sunroof", "Apple CarPlay", "360 Camera", "Cruise Control", "Air Conditioning"], description: "Commanding X5 for executives and VIP transfers. Airport delivery available on request.", status: "available", verified: true, rating: 4.8, review_count: 37, trips_completed: 49 },
  { key: "veh-10", owner: "own-4", make: "Suzuki", model: "Jimny", year: 2023, plate: "RAG 456 L", type: "4x4", transmission: "manual", fuel: "petrol", seats: 4, price_per_day: 60000, location: "Nyagatare", lat: -1.2968, lng: 30.3269, images: [img("photo-1533106418989-88406c7cc8ca"), img("photo-1502877338535-766e1452684a")], features: ["4WD", "Air Conditioning", "Bluetooth", "Roof Rack"], description: "Pocket-sized 4x4 that punches far above its weight — Akagera game drives on a budget.", status: "pending_approval", verified: false, rating: 0, review_count: 0, trips_completed: 0 },
  { key: "veh-11", owner: "own-3", make: "Toyota", model: "Prado TX", year: 2021, plate: "RAE 789 M", type: "suv", transmission: "automatic", fuel: "diesel", seats: 7, price_per_day: 110000, location: "Musanze", lat: -1.5033, lng: 29.628, images: [img("photo-1594502184342-2e12f877aa73"), img("photo-1511919884226-fd3cad34687c")], features: ["4WD", "7 Seats", "Air Conditioning", "GPS Navigation", "Roof Rack"], description: "The classic Rwandan upcountry SUV — Prado comfort with genuine off-road capability.", status: "available", verified: true, rating: 4.7, review_count: 92, trips_completed: 156 },
  { key: "veh-12", owner: "own-2", make: "Hyundai", model: "Tucson", year: 2022, plate: "RAF 234 N", type: "suv", transmission: "automatic", fuel: "petrol", seats: 5, price_per_day: 65000, location: "Kigali — Nyarugenge", lat: -1.9536, lng: 30.0605, images: [img("photo-1632245889029-e406faaa34cd"), img("photo-1605559424843-9e4c228bf1c2")], features: ["Air Conditioning", "Apple CarPlay", "Reverse Camera", "Bluetooth", "Cruise Control"], description: "Modern Tucson with a full tech suite — effortless city driving and weekend escapes.", status: "available", verified: true, rating: 4.5, review_count: 44, trips_completed: 71 },
];

console.log("→ Seeding vehicles…");
const vid = {};
const vehicleRows = VEHICLES.map((v) => {
  vid[v.key] = randomUUID();
  const { key, owner, ...rest } = v;
  return { id: vid[v.key], owner_id: uid[owner], ...rest };
});
const { error: vehErr } = await sb.from("vehicles").insert(vehicleRows);
if (vehErr) { console.error("  ✗ vehicles:", vehErr.message); process.exit(1); }
console.log(`  ✓ ${vehicleRows.length} vehicles`);

// ── 6. bookings ──────────────────────────────────────────────────────────────
const BOOKINGS = [
  { key: "bk-1001", customer: "cus-1", vehicle: "veh-1", owner: "own-1", start_date: "2026-09-18", end_date: "2026-09-21", pickup_location: "Kigali — Gasabo", return_location: "Kigali — Gasabo", extras: ["gps"], total_price: 459000, status: "confirmed", payment_method: "momo", payment_point: "pickup", payment_confirmed: false, qr_code: "LRA-BK1001-DIANE", driver_name: "Diane Ingabire", driver_license: "DL-2020-88412" },
  { key: "bk-1002", customer: "cus-1", vehicle: "veh-5", owner: "own-2", start_date: "2026-08-12", end_date: "2026-08-14", pickup_location: "Kigali International Airport", return_location: "Kigali International Airport", extras: ["airport-delivery"], total_price: 90000, status: "completed", payment_method: "cash", payment_point: "pickup", payment_confirmed: true, qr_code: "LRA-BK1002-DIANE", driver_name: "Diane Ingabire", driver_license: "DL-2020-88412" },
  { key: "bk-1003", customer: "cus-2", vehicle: "veh-4", owner: "own-3", start_date: "2026-09-25", end_date: "2026-09-28", pickup_location: "Musanze", return_location: "Musanze", extras: ["driver"], total_price: 345000, status: "requested", payment_method: "cash", payment_point: "office", payment_confirmed: false, qr_code: "LRA-BK1003-SAMUEL", driver_name: "Samuel Nkurunziza", driver_license: "DL-2019-55231" },
  { key: "bk-1004", customer: "cus-3", vehicle: "veh-3", owner: "own-1", start_date: "2026-09-05", end_date: "2026-09-09", pickup_location: "Kigali — Kicukiro", return_location: "Kigali — Kicukiro", extras: [], total_price: 300000, status: "picked_up", payment_method: "card", payment_point: "pickup", payment_confirmed: true, qr_code: "LRA-BK1004-GRACE", driver_name: "Grace Umutoni", driver_license: "DL-2021-90214" },
  { key: "bk-1005", customer: "cus-2", vehicle: "veh-8", owner: "own-5", start_date: "2026-07-20", end_date: "2026-07-24", pickup_location: "Kigali — Kicukiro", return_location: "Kigali — Kicukiro", extras: ["child-seat"], total_price: 340000, status: "completed", payment_method: "momo", payment_point: "office", payment_confirmed: true, qr_code: "LRA-BK1005-SAMUEL", driver_name: "Samuel Nkurunziza", driver_license: "DL-2019-55231" },
  // extra completed bookings so seeded reviews satisfy the booking_id FK
  { key: "bk-x1", customer: "cus-3", vehicle: "veh-1", owner: "own-1", start_date: "2026-06-10", end_date: "2026-06-14", pickup_location: "Kigali — Gasabo", return_location: "Kigali — Gasabo", extras: [], total_price: 600000, status: "completed", payment_method: "cash", payment_point: "pickup", payment_confirmed: true, qr_code: "LRA-BKX1-GRACE", driver_name: "Grace Umutoni", driver_license: "DL-2021-90214" },
  { key: "bk-x2", customer: "cus-2", vehicle: "veh-3", owner: "own-1", start_date: "2026-05-22", end_date: "2026-05-25", pickup_location: "Kigali — Kicukiro", return_location: "Kigali — Kicukiro", extras: [], total_price: 225000, status: "completed", payment_method: "momo", payment_point: "pickup", payment_confirmed: true, qr_code: "LRA-BKX2-SAMUEL", driver_name: "Samuel Nkurunziza", driver_license: "DL-2019-55231" },
];

console.log("→ Seeding bookings…");
const bid = {};
const bookingRows = BOOKINGS.map((b) => {
  bid[b.key] = randomUUID();
  const { key, customer, vehicle, owner, ...rest } = b;
  return {
    id: bid[b.key],
    customer_id: uid[customer],
    vehicle_id: vid[vehicle],
    owner_id: uid[owner],
    booking_fee: 0,
    ...rest,
  };
});
const { error: bkErr } = await sb.from("bookings").insert(bookingRows);
if (bkErr) { console.error("  ✗ bookings:", bkErr.message); process.exit(1); }
console.log(`  ✓ ${bookingRows.length} bookings`);

// ── 7. reviews ───────────────────────────────────────────────────────────────
const REVIEWS = [
  { booking: "bk-1002", vehicle: "veh-5", customer: "cus-1", rating: 5, comment: "Seamless airport pickup — the Corolla was spotless and the owner was waiting when I landed. Paid cash on arrival, zero hassle.", owner_reply: "Thank you Diane! Always a pleasure hosting you." },
  { booking: "bk-1005", vehicle: "veh-8", customer: "cus-2", rating: 5, comment: "Took the Sorento to Akagera with the family. Child seat was already installed. Excellent service.", owner_reply: null },
  { booking: "bk-x1", vehicle: "veh-1", customer: "cus-3", rating: 5, comment: "The Land Cruiser handled Volcanoes NP roads like a dream. Worth every franc.", owner_reply: null },
  { booking: "bk-x2", vehicle: "veh-3", customer: "cus-2", rating: 4, comment: "Great hybrid economy — did Kigali to Huye on half a tank.", owner_reply: null },
];

console.log("→ Seeding reviews…");
const { error: revErr } = await sb.from("reviews").insert(
  REVIEWS.map((r) => ({
    booking_id: bid[r.booking],
    vehicle_id: vid[r.vehicle],
    customer_id: uid[r.customer],
    rating: r.rating,
    comment: r.comment,
    owner_reply: r.owner_reply,
  }))
);
if (revErr) { console.error("  ✗ reviews:", revErr.message); process.exit(1); }
console.log(`  ✓ ${REVIEWS.length} reviews`);

console.log("\nDone! Demo logins (password: demo1234):");
console.log("  customer@lora.rw · owner@lora.rw · admin@lora.rw");
