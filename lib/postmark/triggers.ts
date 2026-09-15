import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { bookingFromRow, inspectionFromRow, sosFromRow, userFromRow, vehicleFromRow, corporateFromRow } from "@/lib/supabase/mappers";
import { USD_RATE } from "@/lib/constants";
import { bookingRef, buildBookingQrPayload, fmtDate, fmtDateTime, rentalDays } from "@/lib/utils";
import { sendEmail, type SendResult } from "./send";
import { url } from "./config";
import type { EmailLocale } from "./i18n";
import type { Booking, User, Vehicle } from "@/types";

// ─── Event catalogue ──────────────────────────────────────────────────────────
// Server-side. Every event loads its entities from Supabase (never trusts client
// payloads), builds template data, and fans out to the right recipients.

export const EMAIL_EVENTS = [
  "booking.requested",
  "booking.confirmed",
  "booking.declined",
  "booking.cancelled",
  "booking.picked_up",
  "booking.returned",
  "booking.completed",
  "user.registered",
  "user.kyc_approved",
  "user.kyc_rejected",
  "vehicle.approved",
  "vehicle.rejected",
  "sos.created",
  "inspection.created",
  "corporate.approved",
  "referral.rewarded",
  "review.request",
  "review.published",
  "review.replied",
  "review.flagged",
  "review.hidden",
  "review.restored",
  "review.deleted",
  "review.reply_deleted",
  "review.reminder",
  "review.weekly_digest",
  "review.milestone",
] as const;
export type EmailEvent = (typeof EMAIL_EVENTS)[number];

export interface TriggerInput {
  event: EmailEvent;
  /** Primary entity id (booking id, user id, vehicle id, sos id, inspection id, account id) */
  id: string;
  /** Who initiated the action (verified caller) */
  actor: { id: string; role: string };
  meta?: Record<string, string | number | boolean | undefined>;
}

export interface TriggerResult {
  ok: boolean;
  sent: SendResult[];
  reason?: string;
}

type Ctx = { sb: NonNullable<ReturnType<typeof getSupabaseAdmin>> };

const first = (name?: string) => (name ?? "").trim().split(/\s+/)[0] || "there";
const locale = (u?: User | null): EmailLocale => (["en", "rw", "fr"].includes(u?.preferredLocale ?? "") ? (u!.preferredLocale as EmailLocale) : "en");
const fmtTs = (iso?: string) => (iso ? fmtDateTime(iso) : fmtDateTime(new Date().toISOString()));

async function loadUser(sb: Ctx["sb"], id: string) {
  const { data } = await sb.from("users").select("*").eq("id", id).maybeSingle();
  return data ? userFromRow(data) : null;
}
async function loadAdmins(sb: Ctx["sb"]) {
  const { data } = await sb.from("users").select("*").eq("role", "admin").eq("email_suppressed", false).limit(10);
  return (data ?? []).map(userFromRow);
}
async function loadBookingBundle(sb: Ctx["sb"], bookingId: string) {
  const { data: b } = await sb.from("bookings").select("*").eq("id", bookingId).maybeSingle();
  if (!b) return null;
  const booking = bookingFromRow(b);
  const [{ data: v }, customer, owner] = await Promise.all([
    sb.from("vehicles").select("*").eq("id", booking.vehicleId).maybeSingle(),
    loadUser(sb, booking.customerId),
    loadUser(sb, booking.ownerId),
  ]);
  return { booking, vehicle: v ? vehicleFromRow(v) : null, customer, owner };
}

function bookingData(b: Booking, v: Vehicle | null, customer: User | null, owner: User | null) {
  const days = Math.max(1, rentalDays(b.startDate, b.endDate));
  return {
    first_name: first(customer?.name),
    owner_first_name: first(owner?.name),
    owner_name: owner?.name ?? "Owner",
    customer_name: customer?.name ?? "Customer",
    customer_phone: customer?.phone ?? "—",
    booking_id: bookingRef(b.id),
    car_name: v ? `${v.make} ${v.model} ${v.year}` : "your vehicle",
    car_image_url: v?.images?.[0] ?? "",
    pickup_location: b.pickupLocation,
    return_location: b.returnLocation,
    pickup_date: fmtDateTime(b.startDate),
    return_date: fmtDateTime(b.endDate),
    days,
    total_rwf: b.totalPrice,
    total_usd: Math.round(b.totalPrice / USD_RATE),
    booking_url: url("/dashboard/bookings"),
    owner_url: url("/owner/bookings"),
    browse_url: url("/browse"),
    qr_payload: buildBookingQrPayload({
      token: b.qrToken ?? b.qrCode ?? b.id,
      ref: bookingRef(b.id),
      make: v?.make ?? "",
      model: v?.model ?? "",
      year: v?.year ?? "",
      plate: v?.plate ?? "",
      start: fmtDate(b.startDate),
      end: fmtDate(b.endDate),
      pickup: b.pickupLocation,
      total: b.totalPrice,
    }),
  };
}

const can = (u: User | null) => !!u?.email && !("emailSuppressed" in (u as object) && (u as unknown as { emailSuppressed?: boolean }).emailSuppressed);

// ─── Dispatcher ───────────────────────────────────────────────────────────────
export async function dispatchEmailEvent(input: TriggerInput): Promise<TriggerResult> {
  const sb = getSupabaseAdmin();
  if (!sb) return { ok: false, sent: [], reason: "Supabase admin not configured" };
  const { event, id, actor, meta = {} } = input;
  const sent: SendResult[] = [];
  const isAdmin = actor.role === "admin";
  const push = async (p: Parameters<typeof sendEmail>[0] | null) => {
    if (p) sent.push(await sendEmail(p));
  };

  // ── Bookings ────────────────────────────────────────────────────────────────
  if (event.startsWith("booking.")) {
    const bundle = await loadBookingBundle(sb, id);
    if (!bundle) return { ok: false, sent, reason: "Booking not found" };
    const { booking: b, vehicle: v, customer, owner } = bundle;
    const party = isAdmin || actor.id === b.customerId || actor.id === b.ownerId;
    if (!party) return { ok: false, sent, reason: "Forbidden" };
    const d = bookingData(b, v, customer, owner);
    const key = (slug: string, who: string) => `${slug}:${b.id}:${who}`;

    switch (event) {
      case "booking.requested": {
        if (can(customer)) await push({ to: customer!.email, templateSlug: "booking-request-sent", data: d, userId: customer!.id, locale: locale(customer), idempotencyKey: key("booking-request-sent", "c") });
        if (can(owner)) await push({ to: owner!.email, templateSlug: "booking-new-request-owner", data: d, userId: owner!.id, locale: locale(owner), idempotencyKey: key("booking-new-request-owner", "o") });
        for (const a of await loadAdmins(sb)) await push({ to: a.email, templateSlug: "admin-new-booking", data: d, userId: a.id, idempotencyKey: key("admin-new-booking", a.id) });
        break;
      }
      case "booking.confirmed": {
        if (can(customer)) await push({ to: customer!.email, templateSlug: "booking-confirmed", data: d, userId: customer!.id, locale: locale(customer), idempotencyKey: key("booking-confirmed", "c") });
        if (can(owner)) await push({ to: owner!.email, templateSlug: "booking-confirmed-owner", data: d, userId: owner!.id, locale: locale(owner), idempotencyKey: key("booking-confirmed-owner", "o") });
        break;
      }
      case "booking.declined": {
        if (can(customer)) await push({ to: customer!.email, templateSlug: "booking-declined", data: { ...d, browse_url: url(`/browse?type=${v?.type ?? ""}`) }, userId: customer!.id, locale: locale(customer), idempotencyKey: key("booking-declined", "c") });
        break;
      }
      case "booking.cancelled": {
        const byOwner = actor.id === b.ownerId || meta.by === "owner";
        if (byOwner && can(customer)) await push({ to: customer!.email, templateSlug: "booking-cancelled-owner", data: d, userId: customer!.id, locale: locale(customer), idempotencyKey: key("booking-cancelled-owner", "c") });
        if (!byOwner && can(owner)) await push({ to: owner!.email, templateSlug: "booking-cancelled-customer", data: d, userId: owner!.id, locale: locale(owner), idempotencyKey: key("booking-cancelled-customer", "o") });
        break;
      }
      case "booking.picked_up": {
        if (can(customer)) await push({ to: customer!.email, templateSlug: "booking-picked-up", data: { ...d, pickup_date: fmtTs(b.pickedUpAt) }, userId: customer!.id, locale: locale(customer), idempotencyKey: key("booking-picked-up", "c") });
        break;
      }
      case "booking.returned": {
        // No customer email here — the return inspection email covers it. Owner gets a nudge to complete.
        break;
      }
      case "booking.completed": {
        const points = Math.floor(b.totalPrice / 1000);
        if (can(customer)) {
          await push({ to: customer!.email, templateSlug: "booking-completed", data: { ...d, points_earned: points, review_url: url(`/dashboard/bookings/${b.id}/review`) }, userId: customer!.id, locale: locale(customer), idempotencyKey: key("booking-completed", "c") });
          // Review request — the dedicated ask, linked straight to the form.
          await push({ to: customer!.email, templateSlug: "review-request", data: { customer_name: d.first_name, vehicle_name: d.car_name, booking_ref: d.booking_id, review_url: url(`/dashboard/bookings/${b.id}/review`) }, userId: customer!.id, locale: locale(customer), idempotencyKey: key("review-request", "c") });
          const { data: loy } = await sb.from("loyalty_points").select("points, tier").eq("user_id", b.customerId).maybeSingle();
          const balance = loy?.points ?? points;
          const tier = loy?.tier ?? "Bronze";
          const next = tier === "Bronze" ? ["Silver", 1000] : tier === "Silver" ? ["Gold", 5000] : tier === "Gold" ? ["Platinum", 15000] : ["Platinum", balance];
          await push({ to: customer!.email, templateSlug: "loyalty-points-earned", data: { first_name: d.first_name, points, balance, tier, next_tier: next[0] as string, to_next: Math.max(0, (next[1] as number) - balance), booking_id: d.booking_id }, userId: customer!.id, locale: locale(customer), idempotencyKey: key("loyalty-points-earned", "c") });
        }
        break;
      }
    }
    return { ok: true, sent };
  }

  // ── Users ───────────────────────────────────────────────────────────────────
  if (event.startsWith("user.")) {
    if (!isAdmin && actor.id !== id) return { ok: false, sent, reason: "Forbidden" };
    const u = await loadUser(sb, id);
    if (!u) return { ok: false, sent, reason: "User not found" };
    const base = { first_name: first(u.name) };
    switch (event) {
      case "user.registered": {
        if (can(u)) {
          await push({ to: u.email, templateSlug: "auth-welcome-success", data: base, userId: u.id, locale: locale(u), idempotencyKey: `auth-welcome-success:${u.id}` });
          if (u.role === "owner") await push({ to: u.email, templateSlug: "owner-welcome", data: base, userId: u.id, locale: locale(u), idempotencyKey: `owner-welcome:${u.id}` });
        }
        for (const a of await loadAdmins(sb)) await push({ to: a.email, templateSlug: "admin-new-user", data: { role: u.role, name: u.name, email: u.email, phone: u.phone || "—", referred_by: u.referredBy ?? "" }, userId: a.id, idempotencyKey: `admin-new-user:${u.id}:${a.id}` });
        break;
      }
      case "user.kyc_approved":
        if (!isAdmin) return { ok: false, sent, reason: "Forbidden" };
        if (can(u)) await push({ to: u.email, templateSlug: "auth-kyc-approved", data: { ...base, is_owner: u.role === "owner" }, userId: u.id, locale: locale(u), idempotencyKey: `auth-kyc-approved:${u.id}:${Date.now() >> 16}` });
        break;
      case "user.kyc_rejected":
        if (!isAdmin) return { ok: false, sent, reason: "Forbidden" };
        if (can(u)) await push({ to: u.email, templateSlug: "auth-kyc-rejected", data: { ...base, reason: String(meta.reason ?? "Documents could not be verified. Please upload clear, valid copies.") }, userId: u.id, locale: locale(u) });
        break;
    }
    return { ok: true, sent };
  }

  // ── Vehicles ────────────────────────────────────────────────────────────────
  if (event.startsWith("vehicle.")) {
    if (!isAdmin) return { ok: false, sent, reason: "Forbidden" };
    const { data: row } = await sb.from("vehicles").select("*").eq("id", id).maybeSingle();
    if (!row) return { ok: false, sent, reason: "Vehicle not found" };
    const v = vehicleFromRow(row);
    const o = await loadUser(sb, v.ownerId);
    if (!can(o)) return { ok: true, sent };
    const d = { first_name: first(o!.name), car_name: `${v.make} ${v.model} ${v.year}`, car_image_url: v.images?.[0] ?? "", plate: v.plate, listing_url: url(`/cars/${v.id}`) };
    if (event === "vehicle.approved") await push({ to: o!.email, templateSlug: "owner-listing-approved", data: d, userId: o!.id, locale: locale(o), idempotencyKey: `owner-listing-approved:${v.id}` });
    else await push({ to: o!.email, templateSlug: "owner-listing-rejected", data: { ...d, reason_short: String(meta.reason_short ?? "Review"), reason: String(meta.reason ?? "Please review the listing details and resubmit.") }, userId: o!.id, locale: locale(o) });
    return { ok: true, sent };
  }

  // ── SOS ─────────────────────────────────────────────────────────────────────
  if (event === "sos.created") {
    const { data: row } = await sb.from("sos_alerts").select("*").eq("id", id).maybeSingle();
    if (!row) return { ok: false, sent, reason: "SOS not found" };
    const s = sosFromRow(row);
    if (!isAdmin && actor.id !== s.userId) return { ok: false, sent, reason: "Forbidden" };
    const u = await loadUser(sb, s.userId);
    const bundle = s.bookingId ? await loadBookingBundle(sb, s.bookingId) : null;
    const d = {
      customer_name: u?.name ?? "A customer",
      customer_phone: u?.phone ?? "—",
      sos_type: s.type,
      booking_id: bundle ? bookingRef(bundle.booking.id) : "—",
      car_name: bundle?.vehicle ? `${bundle.vehicle.make} ${bundle.vehicle.model}` : "—",
      lat: s.lat ?? 0,
      lng: s.lng ?? 0,
      timestamp: fmtTs(s.createdAt),
      alert_id: s.id,
    };
    for (const a of await loadAdmins(sb)) await push({ to: a.email, templateSlug: "admin-sos-alert", data: d, userId: a.id, idempotencyKey: `admin-sos-alert:${s.id}:${a.id}`, tag: "sos" });
    return { ok: true, sent };
  }

  // ── Inspections ─────────────────────────────────────────────────────────────
  if (event === "inspection.created") {
    const { data: row } = await sb.from("inspections").select("*").eq("id", id).maybeSingle();
    if (!row) return { ok: false, sent, reason: "Inspection not found" };
    const i = inspectionFromRow(row);
    const bundle = await loadBookingBundle(sb, i.bookingId);
    if (!bundle) return { ok: false, sent, reason: "Booking not found" };
    const { booking: b, vehicle: v, customer, owner } = bundle;
    if (!isAdmin && actor.id !== b.ownerId && actor.id !== b.customerId) return { ok: false, sent, reason: "Forbidden" };
    const d = {
      first_name: first(customer?.name),
      booking_id: bookingRef(b.id),
      car_name: v ? `${v.make} ${v.model} ${v.year}` : "vehicle",
      plate: v?.plate ?? "—",
      odometer: i.odometerKm ?? 0,
      fuel_pct: i.fuelLevel ?? 0,
      notes: i.notes ?? "",
      photo_count: i.photos?.length ?? 0,
      inspected_at: fmtTs(i.createdAt),
      inspector: `${owner?.name ?? "Owner"} (owner)`,
      new_damage: i.type === "return" && !!i.notes && /damage|scratch|dent|crack/i.test(i.notes),
    };
    const slug = i.type === "pickup" ? "inspection-pickup-report" : "inspection-return-report";
    if (can(customer)) await push({ to: customer!.email, templateSlug: slug, data: d, userId: customer!.id, locale: locale(customer), idempotencyKey: `${slug}:${i.id}:c` });
    if (can(owner)) await push({ to: owner!.email, templateSlug: slug, data: { ...d, first_name: first(owner!.name) }, userId: owner!.id, locale: locale(owner), idempotencyKey: `${slug}:${i.id}:o` });
    return { ok: true, sent };
  }

  // ── Corporate ───────────────────────────────────────────────────────────────
  if (event === "corporate.approved") {
    if (!isAdmin) return { ok: false, sent, reason: "Forbidden" };
    const { data: row } = await sb.from("corporate_accounts").select("*").eq("id", id).maybeSingle();
    if (!row) return { ok: false, sent, reason: "Account not found" };
    const c = corporateFromRow(row);
    await push({ to: c.contactEmail, templateSlug: "corporate-welcome", data: { contact_name: first(c.contactName), company_name: c.companyName, credit_terms: c.creditTerms === "net30" ? "Net 30" : c.creditTerms === "net15" ? "Net 15" : "Prepaid", account_url: url("/corporate") }, idempotencyKey: `corporate-welcome:${c.id}` });
    return { ok: true, sent };
  }

  // ── Referral ────────────────────────────────────────────────────────────────
  if (event === "referral.rewarded") {
    const { data: row } = await sb.from("referrals").select("*").eq("id", id).maybeSingle();
    if (!row) return { ok: false, sent, reason: "Referral not found" };
    const [referrer, referee] = await Promise.all([loadUser(sb, row.referrer_id), loadUser(sb, row.referee_id)]);
    if (!isAdmin && actor.id !== row.referrer_id && actor.id !== row.referee_id) return { ok: false, sent, reason: "Forbidden" };
    const { count } = await sb.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", row.referrer_id).eq("status", "rewarded");
    if (can(referrer)) await push({ to: referrer!.email, templateSlug: "referral-reward-earned", data: { first_name: first(referrer!.name), friend_name: first(referee?.name), reward_rwf: row.reward_amount ?? 10000, total_referrals: count ?? 1 }, userId: referrer!.id, locale: locale(referrer), idempotencyKey: `referral-reward-earned:${row.id}` });
    return { ok: true, sent };
  }

  // ── Reviews ─────────────────────────────────────────────────────────────────
  if (event.startsWith("review.")) {
    // Load the review with its parties. For deleted entities the row may be
    // gone — callers pass the needed fields through meta.
    const { data: row } = await sb
      .from("reviews")
      .select("*, customer:users!customer_id(name), reply:review_replies(*, owner:users!owner_id(name))")
      .eq("id", id)
      .maybeSingle();
    const [customer, owner] = await Promise.all([
      row ? loadUser(sb, row.customer_id) : (meta.customer_id ? loadUser(sb, String(meta.customer_id)) : null),
      row?.owner_id ? loadUser(sb, row.owner_id) : (meta.owner_id ? loadUser(sb, String(meta.owner_id)) : null),
    ]);
    // request/reminder/digest/milestone key off booking or owner id, not a
    // review row — they do their own authorization inside the switch.
    const needsReviewParty = ["review.published", "review.replied", "review.flagged", "review.hidden", "review.restored", "review.deleted", "review.reply_deleted"].includes(event);
    if (needsReviewParty) {
      const party = isAdmin || actor.id === "system" || actor.id === row?.customer_id || actor.id === row?.owner_id;
      if (!party) return { ok: false, sent, reason: "Forbidden" };
    }

    const vehicleName = row
      ? await sb.from("vehicles").select("make, model, year").eq("id", row.vehicle_id).maybeSingle().then(({ data: v }) => (v ? `${v.make} ${v.model} ${v.year}` : "vehicle"))
      : String(meta.vehicle_name ?? "vehicle");
    const d = {
      customer_name: first(customer?.name ?? String(meta.customer_name ?? "")),
      owner_name: first(owner?.name ?? String(meta.owner_name ?? "")),
      vehicle_name: vehicleName,
      rating: row?.rating ?? Number(meta.rating ?? 0),
      review_title: row?.title ?? String(meta.review_title ?? ""),
      review_excerpt: (row?.comment ?? String(meta.review_excerpt ?? "")).slice(0, 200),
      reply_excerpt: (row?.reply?.[0]?.comment ?? String(meta.reply_excerpt ?? "")).slice(0, 200),
      booking_ref: row ? bookingRef(row.booking_id) : String(meta.booking_ref ?? ""),
      review_url: url(`/cars/${row?.vehicle_id ?? meta.vehicle_id ?? ""}#reviews`),
      reason: String(meta.reason ?? ""),
      flag_count: Number(meta.flag_count ?? (Array.isArray(row?.flagged_by) ? row.flagged_by.length : 0)),
    };
    const key = (slug: string, who: string) => `${slug}:${id}:${who}`;

    switch (event) {
      case "review.request": {
        // id = booking id here; only the customer may trigger it for their own booking.
        const bundle = await loadBookingBundle(sb, id);
        if (!bundle) return { ok: false, sent, reason: "Booking not found" };
        if (!isAdmin && actor.id !== bundle.booking.customerId) return { ok: false, sent, reason: "Forbidden" };
        if (can(bundle.customer)) {
          await push({ to: bundle.customer!.email, templateSlug: "review-request", data: { customer_name: first(bundle.customer!.name), vehicle_name: bundle.vehicle ? `${bundle.vehicle.make} ${bundle.vehicle.model} ${bundle.vehicle.year}` : "vehicle", booking_ref: bookingRef(id), review_url: url(`/dashboard/bookings/${id}/review`) }, userId: bundle.customer!.id, locale: locale(bundle.customer), idempotencyKey: `review-request:${id}` });
        }
        break;
      }
      case "review.published": {
        if (can(customer)) await push({ to: customer!.email, templateSlug: "review-published-customer", data: d, userId: customer!.id, locale: locale(customer), idempotencyKey: key("review-published-customer", "c") });
        if (can(owner)) await push({ to: owner!.email, templateSlug: "review-new-owner", data: d, userId: owner!.id, locale: locale(owner), idempotencyKey: key("review-new-owner", "o") });
        break;
      }
      case "review.replied": {
        if (can(customer)) await push({ to: customer!.email, templateSlug: "review-reply-customer", data: d, userId: customer!.id, locale: locale(customer), idempotencyKey: key("review-reply-customer", "c") });
        break;
      }
      case "review.flagged": {
        for (const a of await loadAdmins(sb)) await push({ to: a.email, templateSlug: "review-flagged-admin", data: d, userId: a.id, idempotencyKey: key("review-flagged-admin", a.id) });
        break;
      }
      case "review.hidden": {
        for (const a of await loadAdmins(sb)) await push({ to: a.email, templateSlug: "review-auto-hidden-admin", data: d, userId: a.id, idempotencyKey: key("review-auto-hidden-admin", a.id) });
        if (can(customer)) await push({ to: customer!.email, templateSlug: "review-hidden-customer", data: d, userId: customer!.id, locale: locale(customer), idempotencyKey: key("review-hidden-customer", "c") });
        if (can(owner)) await push({ to: owner!.email, templateSlug: "review-hidden-owner", data: d, userId: owner!.id, locale: locale(owner), idempotencyKey: key("review-hidden-owner", "o") });
        break;
      }
      case "review.restored": {
        if (can(customer)) await push({ to: customer!.email, templateSlug: "review-restored-customer", data: d, userId: customer!.id, locale: locale(customer), idempotencyKey: key("review-restored-customer", "c") });
        break;
      }
      case "review.deleted": {
        if (can(customer)) await push({ to: customer!.email, templateSlug: "review-deleted-customer", data: d, userId: customer!.id, locale: locale(customer), idempotencyKey: key("review-deleted-customer", "c") });
        if (can(owner)) await push({ to: owner!.email, templateSlug: "review-deleted-owner", data: d, userId: owner!.id, locale: locale(owner), idempotencyKey: key("review-deleted-owner", "o") });
        break;
      }
      case "review.reply_deleted": {
        if (can(owner)) await push({ to: owner!.email, templateSlug: "reply-deleted-owner", data: d, userId: owner!.id, locale: locale(owner), idempotencyKey: key("reply-deleted-owner", "o") });
        break;
      }
      case "review.reminder": {
        const bundle = await loadBookingBundle(sb, id);
        if (!bundle) return { ok: false, sent, reason: "Booking not found" };
        if (can(bundle.customer)) await push({ to: bundle.customer!.email, templateSlug: "review-reminder", data: { customer_name: first(bundle.customer!.name), vehicle_name: bundle.vehicle ? `${bundle.vehicle.make} ${bundle.vehicle.model} ${bundle.vehicle.year}` : "vehicle", booking_ref: bookingRef(id), review_url: url(`/dashboard/bookings/${id}/review`) }, userId: bundle.customer!.id, locale: locale(bundle.customer), idempotencyKey: `review-reminder:${id}` });
        break;
      }
      case "review.weekly_digest": {
        // id = owner id; meta carries period/total_reviews/avg_rating/unreplied.
        const o = await loadUser(sb, id);
        if (!o || o.role !== "owner") return { ok: false, sent, reason: "Owner not found" };
        if (can(o)) await push({ to: o.email, templateSlug: "review-weekly-digest-owner", data: { owner_name: first(o.name), period: String(meta.period ?? "this week"), total_reviews: Number(meta.total_reviews ?? 0), avg_rating: String(meta.avg_rating ?? "—"), unreplied: Number(meta.unreplied ?? 0) }, userId: o.id, locale: locale(o), idempotencyKey: `review-weekly-digest:${id}:${meta.period ?? Date.now() >> 20}` });
        break;
      }
      case "review.milestone": {
        const o = await loadUser(sb, id);
        if (!o || o.role !== "owner") return { ok: false, sent, reason: "Owner not found" };
        if (can(o)) await push({ to: o.email, templateSlug: "review-milestone-owner", data: { owner_name: first(o.name), milestone: String(meta.milestone ?? "Milestone"), total_reviews: Number(meta.total_reviews ?? 0), avg_rating: String(meta.avg_rating ?? "—"), response_rate: Number(meta.response_rate ?? 0) }, userId: o.id, locale: locale(o), idempotencyKey: `review-milestone:${id}:${meta.milestone}` });
        break;
      }
    }
    return { ok: true, sent };
  }

  return { ok: false, sent, reason: `Unhandled event: ${event}` };
}
