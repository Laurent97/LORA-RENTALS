import { defineTemplate } from "../types";
import { url } from "../config";
import { badge, button, esc, fmtRWF, greeting, h1, infoCard, p, signature } from "../layout/components";

export const drivers = {
  "driver-kyc-approved": defineTemplate({
    name: "Driver KYC approved", category: "drivers",
    subject: () => "You're a Verified LORA Chauffeur ✅",
    preheader: () => "Your driver application was approved. Start accepting trips.",
    sample: { first_name: "Jean", driver_url: url("/driver") },
    html: (d, t) => [
      badge("✅ Verified", "success"),
      h1(`Welcome to the road, ${esc(d.first_name)}!`, { center: true }),
      p("Your driver documents have been approved. You're now a verified LORA chauffeur and customers can book you.", { center: true }),
      infoCard("", [
        ["Badge", "Verified Chauffeur"],
        ["Next step", "Open your driver dashboard"],
      ]),
      button("Open Driver Dashboard →", d.driver_url, "gold"),
      p("Keep your phone close — booking requests will arrive by email and in your dashboard.", { muted: true, small: true }),
      signature(t),
    ].join(""),
  }),

  "driver-new-request": defineTemplate({
    name: "New driver request", category: "drivers",
    subject: (d) => `🚗 New Trip Request — ${d.car_name}`,
    preheader: () => "A customer wants to book you as their chauffeur.",
    sample: { first_name: "Jean", customer_name: "Aline", customer_phone: "+250 78X XXX XXX", pickup_date: "21 Sep 2026, 08:00", return_date: "23 Sep 2026, 18:00", pickup_location: "Kigali Airport", car_name: "Toyota Land Cruiser 2022", total_rwf: 150000, driver_url: url("/driver/bookings") },
    html: (d, t) => [
      badge("🚗 New request", "info"),
      greeting(t, d.first_name),
      p("A customer has requested you as their chauffeur for an upcoming trip. Review the details and confirm.", { center: true }),
      infoCard("Trip Details", [
        ["Customer", esc(d.customer_name)],
        ["Customer phone", esc(d.customer_phone)],
        ["Pickup", esc(d.pickup_location)],
        ["When", `${esc(d.pickup_date)} → ${esc(d.return_date)}`],
        ["Vehicle", esc(d.car_name)],
        ["Your net", `${fmtRWF(d.total_rwf)}`],
      ]),
      button("Accept or Decline →", d.driver_url, "gold"),
      signature(t),
    ].join(""),
  }),

  "driver-request-confirmed": defineTemplate({
    name: "Driver confirmed (customer)", category: "drivers",
    subject: (d) => `✅ Your Chauffeur Confirmed — ${d.car_name}`,
    preheader: () => "The driver accepted your trip. You can now coordinate pickup.",
    sample: { first_name: "Aline", driver_name: "Jean", driver_phone: "+250 78X XXX XXX", pickup_date: "21 Sep 2026, 08:00", pickup_location: "Kigali Airport", car_name: "Toyota Land Cruiser 2022", booking_url: url("/dashboard/bookings") },
    html: (d, t) => [
      badge("✅ Chauffeur confirmed", "success"),
      greeting(t, d.first_name),
      p(`Great news — <strong>${esc(d.driver_name)}</strong> has accepted your trip and will be your chauffeur.`, { center: true }),
      infoCard("Contact your chauffeur", [
        ["Name", esc(d.driver_name)],
        ["Phone", `<a href="tel:${d.driver_phone.replace(/\s/g, "")}">${esc(d.driver_phone)}</a>`],
        ["Pickup", esc(d.pickup_location)],
        ["Date", esc(d.pickup_date)],
      ]),
      p("Pay only at pickup or the LORA office. Never pay via WhatsApp, MoMo transfer or external links.", { muted: true, small: true }),
      button("View Booking →", d.booking_url),
      signature(t),
    ].join(""),
  }),

  "driver-trip-completed": defineTemplate({
    name: "Driver trip completed", category: "drivers",
    subject: () => "Trip Complete — How Was Your Chauffeur?",
    preheader: () => "Leave a review and earn points.",
    sample: { first_name: "Aline", driver_name: "Jean", car_name: "Toyota Land Cruiser 2022", review_url: url("/dashboard/bookings") },
    html: (d, t) => [
      badge("⭐ Trip complete", "success"),
      greeting(t, d.first_name),
      p(`Your trip with <strong>${esc(d.driver_name)}</strong> is complete. We'd love to hear about your experience.`, { center: true }),
      infoCard("", [
        ["Chauffeur", esc(d.driver_name)],
        ["Vehicle", esc(d.car_name)],
      ]),
      button("Leave a Review →", d.review_url),
      signature(t, true),
    ].join(""),
  }),

  "driver-earnings-credited": defineTemplate({
    name: "Driver earnings credited", category: "drivers",
    subject: (d) => `💰 Earnings Credited — ${fmtRWF(d.amount_rwf)}`,
    preheader: () => "A trip was completed and your net has been added.",
    sample: { first_name: "Jean", amount_rwf: 135000, total_available_rwf: 450000, earnings_url: url("/driver/earnings") },
    html: (d, t) => [
      badge("💰 Earnings", "gold"),
      greeting(t, d.first_name),
      p(`A trip has been completed and <strong>${fmtRWF(d.amount_rwf)}</strong> has been credited to your earnings.`, { center: true }),
      infoCard("", [
        ["Credited", fmtRWF(d.amount_rwf)],
        ["Available balance", fmtRWF(d.total_available_rwf)],
      ]),
      button("View Earnings →", d.earnings_url, "gold"),
      signature(t),
    ].join(""),
  }),
};
