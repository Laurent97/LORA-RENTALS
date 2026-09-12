import { defineTemplate } from "../types";
import { url } from "../config";
import type { Tx } from "../i18n";
import {
  alert, badge, bullets, button, carImage, esc, fmtRWF, greeting, h1, infoCard, p, payAtPickup, qrImage,
  questions, signature, stars, timeline, totalRow,
} from "../layout/components";

// Shared booking fixture used by every sample.
const B = {
  first_name: "Aline",
  owner_name: "Jean-Paul K.",
  owner_first_name: "Jean-Paul",
  customer_name: "Aline M.",
  customer_phone: "+250 78X XXX XXX",
  booking_id: "LR-7F3A2C",
  car_name: "Toyota Land Cruiser Prado 2021",
  car_image_url: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1072&q=80",
  pickup_location: "Kigali International Airport",
  return_location: "Kigali — Kicukiro",
  pickup_date: "Fri 18 Sep, 09:00",
  return_date: "Mon 21 Sep, 09:00",
  days: 3,
  total_rwf: 255000,
  total_usd: 196,
  booking_url: url("/dashboard/bookings"),
  owner_url: url("/owner/bookings"),
  qr_payload: "LORA:7f3a2c-demo-token",
};

type BD = typeof B;

const details = (d: BD, t: Tx, extra: Parameters<typeof infoCard>[1] = []) =>
  infoCard(esc(d.car_name), [
    [`📍 ${t.pickup}`, esc(d.pickup_location)],
    [`🏁 ${t.return}`, esc(d.return_location)],
    [`🗓️ ${t.dates}`, `${esc(d.pickup_date)} → ${esc(d.return_date)}`],
    ...extra,
  ], totalRow(`💰 ${t.total} (${d.days} days)`, d.total_rwf, `≈ ${d.total_usd} USD · <strong>${t.bookingFee}</strong>`));

export const bookings = {
  "booking-request-sent": defineTemplate({
    name: "Request sent (customer)", category: "bookings",
    subject: (d) => `Booking Request Sent — ${d.car_name}`,
    preheader: () => "The owner has 4 hours to confirm. We'll notify you the moment they do.",
    sample: B,
    html: (d, t) => [
      badge("⏳ Awaiting owner confirmation", "warning"),
      h1(`Request sent, ${esc(d.first_name)}!`, { center: true }),
      p(`${t.booking} #${esc(d.booking_id)}`, { muted: true, center: true }),
      carImage(d.car_image_url, d.car_name),
      details(d, t, [[`👤 ${t.owner}`, `${esc(d.owner_name)} ✅`]]),
      alert("⏱ Owners respond within <strong>4 hours</strong> on average. If they don't, we'll escalate and suggest alternatives.", "info"),
      timeline(t.steps, 0),
      button(t.viewBooking, d.booking_url),
      signature(t, true),
    ].join(""),
  }),

  "booking-new-request-owner": defineTemplate({
    name: "New request (owner)", category: "bookings",
    subject: (d) => `🚗 New Booking Request for ${d.car_name}`,
    preheader: () => "Respond within 4 hours to keep your Fast Responder badge.",
    sample: B,
    html: (d, t) => [
      badge("🚗 New request", "gold"),
      greeting(t, d.owner_first_name),
      p(`<strong>${esc(d.customer_name)}</strong> wants to rent your <strong>${esc(d.car_name)}</strong>.`),
      details(d, t, [[`👤 ${t.customer}`, esc(d.customer_name)], ["📞 Phone", esc(d.customer_phone)]]),
      alert("⏰ <strong>Please respond within 4 hours.</strong> Fast responses earn the ⚡ Fast Responder badge and rank higher in search.", "warning"),
      button("Accept or Decline →", d.owner_url),
      signature(t),
    ].join(""),
  }),

  "booking-confirmed": defineTemplate({
    name: "Confirmed (customer)", category: "bookings",
    subject: (d) => `✅ Booking Confirmed — ${d.car_name} on ${d.pickup_date}`,
    preheader: () => "Your LORA ride is confirmed. Pay at pickup — no booking fee.",
    sample: B,
    html: (d, t) => [
      badge("✅ Booking confirmed", "success"),
      h1(`Your ride is ready, ${esc(d.first_name)}!`, { center: true }),
      p(`${t.booking} #${esc(d.booking_id)}`, { muted: true, center: true }),
      carImage(d.car_image_url, d.car_name),
      details(d, t, [[`👤 ${t.owner}`, `${esc(d.owner_name)} ✅`]]),
      payAtPickup(t),
      button(t.viewBooking, d.booking_url),
      p("Show your QR code at pickup for instant confirmation.", { muted: true, small: true, center: true }),
      timeline(t.steps, 1),
      questions(t),
      signature(t, true),
    ].join(""),
  }),

  "booking-confirmed-owner": defineTemplate({
    name: "Confirmed (owner)", category: "bookings",
    subject: (d) => `You Accepted a Booking — ${d.car_name}`,
    preheader: () => "Get the car ready. Here are the pickup details.",
    sample: B,
    html: (d, t) => [
      badge("✅ Accepted", "success"),
      greeting(t, d.owner_first_name),
      p(`You accepted <strong>${esc(d.customer_name)}</strong>'s booking. Please have the car clean, fuelled and ready at the agreed time.`),
      details(d, t, [[`👤 ${t.customer}`, esc(d.customer_name)], ["📞 Phone", esc(d.customer_phone)]]),
      bullets(["Scan the customer's QR code at handover to confirm pickup", "Complete the pickup inspection with photos and signatures", "Collect payment at pickup — cash, MoMo or card"]),
      button("Open Booking →", d.owner_url, "navy"),
      signature(t),
    ].join(""),
  }),

  "booking-declined": defineTemplate({
    name: "Declined (customer)", category: "bookings",
    subject: () => "Booking Declined — Similar Cars Inside",
    preheader: () => "The owner couldn't take this one. Here are great alternatives.",
    sample: { ...B, browse_url: url("/browse?type=suv") },
    html: (d, t) => [
      badge("Declined", "error"),
      greeting(t, d.first_name),
      p(`Unfortunately the owner of <strong>${esc(d.car_name)}</strong> couldn't accept your request for ${esc(d.pickup_date)} → ${esc(d.return_date)}.`),
      alert("No payment was taken — LORA never charges before pickup.", "info"),
      p("We've picked similar cars that are available for your dates:"),
      button("See Similar Cars →", d.browse_url),
      signature(t),
    ].join(""),
  }),

  "booking-cancelled-customer": defineTemplate({
    name: "Customer cancelled (to owner)", category: "bookings",
    subject: (d) => `Booking Cancelled — ${d.car_name}`,
    preheader: () => "The customer cancelled. Your calendar is open again.",
    sample: B,
    html: (d, t) => [
      badge("Cancelled", "error"),
      greeting(t, d.owner_first_name),
      p(`<strong>${esc(d.customer_name)}</strong> cancelled booking <strong>#${esc(d.booking_id)}</strong> for ${esc(d.pickup_date)} → ${esc(d.return_date)}. Those dates are open on your calendar again.`),
      button("View Calendar →", url("/owner/availability"), "navy"),
      signature(t),
    ].join(""),
  }),

  "booking-cancelled-owner": defineTemplate({
    name: "Owner cancelled (to customer)", category: "bookings",
    subject: () => "Owner Cancelled — Alternatives Inside",
    preheader: () => "We're sorry. Let's get you another great car fast.",
    sample: { ...B, browse_url: url("/browse") },
    html: (d, t) => [
      badge("Cancelled by owner", "error"),
      greeting(t, d.first_name),
      p(`We're sorry — the owner had to cancel your booking for <strong>${esc(d.car_name)}</strong>. This is rare, and it counts against the owner's rating.`),
      alert("🎁 As an apology, we've added <strong>500 LORA Points</strong> to your account.", "gold"),
      p("Our team is standing by on WhatsApp to help you rebook immediately."),
      button("Find Another Car →", d.browse_url),
      questions(t),
      signature(t),
    ].join(""),
  }),

  "booking-reminder-24h": defineTemplate({
    name: "Reminder — 24h", category: "bookings",
    subject: () => "Pickup Tomorrow! Everything You Need 🗓️",
    preheader: () => "Your checklist for a smooth pickup.",
    sample: B,
    html: (d, t) => [
      badge("🗓️ Tomorrow", "gold"),
      greeting(t, d.first_name),
      p(`Your <strong>${esc(d.car_name)}</strong> is ready for pickup tomorrow at <strong>${esc(d.pickup_date)}</strong>.`),
      details(d, t, [[`👤 ${t.owner}`, `${esc(d.owner_name)} ✅`]]),
      bullets(["📱 Your QR code (in the app or this email)", "🪪 Valid driving licence + national ID / passport", `💵 Payment: ${fmtRWF(d.total_rwf)} — cash, MoMo or card`]),
      qrImage(d.qr_payload),
      button(t.viewBooking, d.booking_url),
      signature(t, true),
    ].join(""),
  }),

  "booking-reminder-2h": defineTemplate({
    name: "Reminder — 2h", category: "bookings",
    subject: () => "Your LORA Pickup Is in 2 Hours ✨",
    preheader: () => "Here's your QR code — see you soon.",
    sample: B,
    html: (d, t) => [
      badge("⏰ In 2 hours", "gold"),
      h1(`Almost time, ${esc(d.first_name)}!`, { center: true }),
      p(`Meet ${esc(d.owner_name)} at <strong>${esc(d.pickup_location)}</strong> at <strong>${esc(d.pickup_date)}</strong>.`, { center: true }),
      qrImage(d.qr_payload),
      p("Show this code to the owner to confirm pickup instantly.", { muted: true, small: true, center: true }),
      button("Open Booking →", d.booking_url),
      signature(t, true),
    ].join(""),
  }),

  "booking-picked-up": defineTemplate({
    name: "Trip started", category: "bookings",
    subject: () => "Trip Started — Enjoy Rwanda! 🇷🇼",
    preheader: () => "Pickup confirmed. Drive safe and have a wonderful trip.",
    sample: B,
    html: (d, t) => [
      badge("🚗 Trip started", "success"),
      h1(`Enjoy the road, ${esc(d.first_name)}!`, { center: true }),
      carImage(d.car_image_url, d.car_name),
      p(`Pickup of <strong>${esc(d.car_name)}</strong> was confirmed at ${esc(d.pickup_date)}. Return is due <strong>${esc(d.return_date)}</strong> at ${esc(d.return_location)}.`),
      timeline(t.steps, 2),
      alert("🆘 In an emergency, use the <strong>SOS button</strong> in your bookings — it shares your GPS with LORA support instantly. Police 112 · Ambulance 912.", "info"),
      button("View Trip →", d.booking_url),
      signature(t, true),
    ].join(""),
  }),

  "booking-return-reminder": defineTemplate({
    name: "Return reminder", category: "bookings",
    subject: (d) => `Return Reminder — Due ${d.return_date}`,
    preheader: () => "Return checklist for a smooth handover.",
    sample: B,
    html: (d, t) => [
      badge("🏁 Return due", "warning"),
      greeting(t, d.first_name),
      p(`Your <strong>${esc(d.car_name)}</strong> is due back <strong>${esc(d.return_date)}</strong> at <strong>${esc(d.return_location)}</strong>.`),
      bullets(["⛽ Refuel to the level at pickup", "🧹 Remove personal items and rubbish", "📸 The owner will complete a quick return inspection with you"]),
      alert("Need more time? Message the owner or WhatsApp us <em>before</em> the return time to extend.", "info"),
      button("Open Booking →", d.booking_url),
      signature(t),
    ].join(""),
  }),

  "booking-completed": defineTemplate({
    name: "Trip complete + review", category: "bookings",
    subject: () => "Trip Complete — How Was Your Experience?",
    preheader: () => "Leave a review and see the points you earned.",
    sample: { ...B, points_earned: 255, review_url: url("/dashboard/bookings") },
    html: (d, t) => [
      badge("✅ Trip complete", "success"),
      h1(`Thanks for riding with LORA, ${esc(d.first_name)}!`, { center: true }),
      p(`Your ${esc(d.car_name)} trip is complete. You earned <strong style="color:#D4AF37;">+${esc(d.points_earned)} LORA Points</strong> ✨`, { center: true }),
      timeline(t.steps, 3),
      p("How was your experience? Your review helps other travellers and rewards great owners.", { center: true }),
      `<div style="text-align:center;margin:8px 0 0;">${stars(5)}</div>`,
      button("Leave a Review →", d.review_url),
      signature(t, true),
    ].join(""),
  }),

  "booking-receipt": defineTemplate({
    name: "Receipt", category: "bookings",
    subject: (d) => `Your LORA Receipt — #${d.booking_id}`,
    preheader: () => "Summary of your rental and payment.",
    sample: { ...B, payment_method: "MTN MoMo", paid_at: "21 Sep 2026, 09:14", subtotal_rwf: 240000, extras_rwf: 15000, discount_rwf: 0 },
    html: (d, t) => [
      badge("🧾 Receipt", "navy"),
      h1(`Receipt #${esc(d.booking_id)}`),
      p(`Paid ${esc(d.paid_at)} via <strong>${esc(d.payment_method)}</strong>`, { muted: true }),
      infoCard(esc(d.car_name), [
        [`🗓️ ${t.dates}`, `${esc(d.pickup_date)} → ${esc(d.return_date)} (${d.days} days)`],
        ["Rental", fmtRWF(d.subtotal_rwf)],
        ["Extras", fmtRWF(d.extras_rwf)],
        ["Discount", d.discount_rwf ? `−${fmtRWF(d.discount_rwf)}` : "—"],
        ["Booking fee", "RWF 0", { color: "#10B981", strong: true }],
      ], totalRow(`💰 ${t.total} paid`, d.total_rwf, `≈ ${d.total_usd} USD`)),
      p("Keep this email for your records. A PDF copy is available in your dashboard.", { muted: true, small: true }),
      button("Download PDF →", d.booking_url, "navy"),
      signature(t),
    ].join(""),
  }),

  "booking-qr-pickup": defineTemplate({
    name: "QR pickup code", category: "bookings",
    subject: () => "Your Pickup QR Code 📱",
    preheader: () => "Show this at pickup — that's it.",
    sample: B,
    html: (d, t) => [
      badge("📱 Pickup QR", "gold"),
      h1(`Your pickup pass, ${esc(d.first_name)}`, { center: true }),
      p(`${t.booking} #${esc(d.booking_id)} · ${esc(d.car_name)}`, { muted: true, center: true }),
      qrImage(d.qr_payload),
      p("The owner scans this code to confirm handover. It's unique to your booking — don't share it.", { center: true, small: true }),
      details(d, t),
      button("Open in App →", d.booking_url),
      signature(t, true),
    ].join(""),
  }),

  "booking-owner-sla-warning": defineTemplate({
    name: "Owner SLA warning", category: "bookings",
    subject: (d) => `⏰ Respond to Booking — ${d.hours_left}h Left`,
    preheader: () => "A customer is waiting. Respond now to keep your ranking.",
    sample: { ...B, hours_left: 1 },
    html: (d, t) => [
      badge(`⏰ ${d.hours_left}h left`, "warning"),
      greeting(t, d.owner_first_name),
      p(`<strong>${esc(d.customer_name)}</strong> is still waiting for your answer on <strong>${esc(d.car_name)}</strong> (${esc(d.pickup_date)} → ${esc(d.return_date)}).`),
      alert(`If you don't respond within <strong>${esc(d.hours_left)} hour(s)</strong>, the request will be escalated to LORA admin and may be auto-cancelled. This affects your response-time rating.`, "warning"),
      button("Respond Now →", d.owner_url),
      signature(t),
    ].join(""),
  }),

  "booking-sla-escalation": defineTemplate({
    name: "SLA escalated", category: "bookings",
    subject: (d) => `Booking Escalated to Admin — #${d.booking_id}`,
    preheader: () => "The 4-hour response window has passed.",
    sample: B,
    html: (d, t) => [
      badge("🚨 Escalated", "error"),
      h1(`Booking #${esc(d.booking_id)} escalated`),
      p(`The owner did not respond within the 4-hour SLA. LORA admin is now handling this request and will contact both parties.`),
      details(d, t, [[`👤 ${t.owner}`, esc(d.owner_name)], [`👤 ${t.customer}`, esc(d.customer_name)]]),
      button(t.openAdmin, url("/admin/bookings"), "red"),
      signature(t),
    ].join(""),
  }),

  "booking-auto-cancelled": defineTemplate({
    name: "Auto-cancelled (no response)", category: "bookings",
    subject: () => "Booking Auto-Cancelled — No Owner Response",
    preheader: () => "No charge was made. Let's find you another car.",
    sample: { ...B, browse_url: url("/browse") },
    html: (d, t) => [
      badge("Auto-cancelled", "error"),
      greeting(t, d.first_name),
      p(`We're sorry — the owner of <strong>${esc(d.car_name)}</strong> didn't respond in time, so booking #${esc(d.booking_id)} was cancelled automatically.`),
      alert("No payment was taken. Your dates are free to rebook.", "info"),
      button("Find Another Car →", d.browse_url),
      questions(t),
      signature(t),
    ].join(""),
  }),
};
