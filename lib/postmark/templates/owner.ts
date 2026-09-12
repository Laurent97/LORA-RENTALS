import { defineTemplate } from "../types";
import { url } from "../config";
import { alert, badge, bullets, button, carImage, esc, featureGrid, fmtRWF, greeting, h1, infoCard, p, quote, signature, stars, stats } from "../layout/components";

const O = {
  first_name: "Jean-Paul",
  car_name: "Toyota Land Cruiser Prado 2021",
  car_image_url: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1072&q=80",
  plate: "RAD 123 A",
};

export const owner = {
  "owner-welcome": defineTemplate({
    name: "Owner welcome", category: "owner",
    subject: () => "Welcome to LORA — List Your First Car 🚗",
    preheader: () => "Turn your car into income with verified renters.",
    sample: { first_name: "Jean-Paul" },
    html: (d, t) => [
      badge("🚗 Owner account", "gold"),
      h1(`Welcome, ${esc(d.first_name)}!`, { center: true }),
      p("You've joined Rwanda's premium car-sharing network. Here's how to start earning:", { center: true }),
      featureGrid([
        { icon: "1️⃣", title: "Complete KYC", body: "Upload your ID and ownership documents — approval within 24h." },
        { icon: "2️⃣", title: "List your car", body: "Photos, specs, price per day and the payment methods you accept." },
        { icon: "3️⃣", title: "Set availability", body: "Block dates you need the car; everything else is bookable." },
        { icon: "4️⃣", title: "Respond fast", body: "Reply within 4h to earn the ⚡ Fast Responder badge." },
      ]),
      button("List Your First Car →", url("/owner/fleet")),
      signature(t),
    ].join(""),
  }),

  "owner-listing-approved": defineTemplate({
    name: "Listing approved", category: "owner",
    subject: (d) => `Your ${d.car_name} Is Live! 🎉`,
    preheader: () => "Customers can now find and book your car.",
    sample: { ...O, listing_url: url("/cars/demo") },
    html: (d, t) => [
      badge("🎉 Live", "success"),
      h1(`${esc(d.car_name)} is live!`, { center: true }),
      carImage(d.car_image_url, d.car_name),
      p(`Congratulations, ${esc(d.first_name)} — your listing passed review and is now visible to thousands of travellers.`),
      bullets(["Keep your calendar up to date to avoid declines", "Great photos get 3× more bookings", "Respond within 4 hours to rank higher"]),
      button("View Listing →", d.listing_url),
      signature(t),
    ].join(""),
  }),

  "owner-listing-rejected": defineTemplate({
    name: "Listing needs changes", category: "owner",
    subject: (d) => `Listing Needs Changes — ${d.reason_short}`,
    preheader: () => "A few fixes and your car will be live.",
    sample: { ...O, reason_short: "Photos", reason: "Please add at least 4 clear exterior photos in daylight and one interior photo." },
    html: (d, t) => [
      badge("⚠️ Changes needed", "warning"),
      greeting(t, d.first_name),
      p(`We reviewed <strong>${esc(d.car_name)}</strong> but couldn't publish it yet.`),
      alert(`<strong>What to fix:</strong> ${esc(d.reason)}`, "warning"),
      button("Edit Listing →", url("/owner/fleet")),
      signature(t),
    ].join(""),
  }),

  "owner-earnings-summary": defineTemplate({
    name: "Monthly earnings", category: "owner",
    subject: (d) => `Your Monthly Earnings — ${d.month}`,
    preheader: (d) => `${fmtRWF(d.net_rwf)} earned across ${d.trips} trips.`,
    sample: { first_name: "Jean-Paul", month: "August 2026", gross_rwf: 1275000, net_rwf: 1122000, trips: 5, days_rented: 17, avg_rating: 4.9, occupancy_pct: 55 },
    html: (d, t) => [
      badge(`📊 ${esc(d.month)}`, "navy"),
      h1(`Great month, ${esc(d.first_name)}!`),
      stats([
        { label: "Net earnings", value: fmtRWF(d.net_rwf), color: "#10B981" },
        { label: "Trips", value: String(d.trips) },
        { label: "Days rented", value: String(d.days_rented) },
      ]),
      infoCard("", [["Gross", fmtRWF(d.gross_rwf)], ["Occupancy", `${d.occupancy_pct}%`], ["Average rating", `${stars(Number(d.avg_rating))} ${d.avg_rating}`]]),
      p("💡 Tip: owners who enable airport pickup see ~20% higher occupancy.", { muted: true, small: true }),
      button("Full Report →", url("/owner/earnings"), "navy"),
      signature(t),
    ].join(""),
  }),

  "owner-kyc-reminder": defineTemplate({
    name: "KYC reminder", category: "owner",
    subject: () => "Complete Your KYC to Start Earning",
    preheader: () => "Your listing can't go live until you're verified.",
    sample: { first_name: "Jean-Paul" },
    html: (d, t) => [
      badge("🪪 Verification pending", "warning"),
      greeting(t, d.first_name),
      p("You're almost ready to earn. We just need your identity and vehicle ownership documents to activate your listings."),
      bullets(["National ID or passport", "Yellow card (carte jaune) for each vehicle", "Valid insurance certificate"]),
      button("Upload Documents →", url("/dashboard/profile")),
      signature(t),
    ].join(""),
  }),

  "owner-review-received": defineTemplate({
    name: "New review", category: "owner",
    subject: (d) => `New ${d.rating}★ Review for ${d.car_name}`,
    preheader: (d) => `"${String(d.review_text).slice(0, 80)}"`,
    sample: { ...O, rating: 5, reviewer: "Aline M.", review_text: "Spotless car, Jean-Paul was on time and super friendly. Perfect for our Akagera trip!" },
    html: (d, t) => [
      badge("⭐ New review", "gold"),
      greeting(t, d.first_name),
      p(`<strong>${esc(d.reviewer)}</strong> left a review for your <strong>${esc(d.car_name)}</strong>:`),
      `<div style="text-align:center;margin:8px 0;">${stars(Number(d.rating))}</div>`,
      quote(esc(d.review_text), esc(d.reviewer)),
      p("Reviews boost your ranking — thank your renters and keep up the great service.", { muted: true, small: true }),
      button("View Reviews →", url("/owner"), "navy"),
      signature(t),
    ].join(""),
  }),

  "owner-vehicle-maintenance": defineTemplate({
    name: "Maintenance reminder", category: "owner",
    subject: (d) => `Maintenance Reminder — ${d.plate}`,
    preheader: () => "Keep your car safe, rated and bookable.",
    sample: { ...O, item: "Insurance renewal", due_date: "30 Sep 2026" },
    html: (d, t) => [
      badge("🔧 Maintenance", "warning"),
      greeting(t, d.first_name),
      p(`A reminder for your <strong>${esc(d.car_name)}</strong> (${esc(d.plate)}):`),
      infoCard("", [["Item", esc(d.item), { strong: true }], ["Due", esc(d.due_date)]]),
      alert("Listings with expired insurance are automatically paused until documents are updated.", "info"),
      button("Update Vehicle →", url("/owner/fleet"), "navy"),
      signature(t),
    ].join(""),
  }),
};
