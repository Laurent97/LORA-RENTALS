import { defineTemplate } from "../types";
import { url } from "../config";
import { alert, badge, button, esc, fmtRWF, greeting, h1, infoCard, p, signature } from "../layout/components";

const I = { first_name: "Aline", booking_id: "LR-7F3A2C", car_name: "Toyota Land Cruiser Prado 2021", plate: "RAD 123 A", odometer: 84210, fuel_pct: 75, notes: "Minor scratch on rear bumper (pre-existing). All lights OK.", photo_count: 8, inspected_at: "18 Sep 2026, 09:05", inspector: "Jean-Paul K. (owner)" };

const inspectionCard = (d: typeof I) =>
  infoCard(esc(d.car_name), [
    ["Plate", esc(d.plate)],
    ["Odometer", `${new Intl.NumberFormat().format(Number(d.odometer))} km`],
    ["Fuel", `${d.fuel_pct}%`],
    ["Photos", `${d.photo_count} attached`],
    ["Inspected by", esc(d.inspector)],
    ["When", esc(d.inspected_at)],
  ]);

export const inspections = {
  "inspection-pickup-report": defineTemplate({
    name: "Pickup inspection report", category: "inspections",
    subject: (d) => `Pickup Inspection Report — #${d.booking_id}`,
    preheader: () => "Signed condition report for your records.",
    sample: I,
    html: (d, t) => [
      badge("📸 Pickup inspection", "navy"),
      greeting(t, d.first_name),
      p(`Here's the signed pickup condition report for booking <strong>#${esc(d.booking_id)}</strong>. Both parties signed digitally.`),
      inspectionCard(d),
      d.notes ? alert(`<strong>Notes:</strong> ${esc(d.notes)}`, "info") : "",
      p("This report protects you — any damage not listed here can't be charged to you at return.", { muted: true, small: true }),
      button("View Full Report →", url("/dashboard/bookings"), "navy"),
      signature(t),
    ].join(""),
  }),

  "inspection-return-report": defineTemplate({
    name: "Return inspection report", category: "inspections",
    subject: (d) => `Return Inspection Report — #${d.booking_id}`,
    preheader: (d) => (d.new_damage ? "New damage was noted — see details." : "Vehicle returned in good condition."),
    sample: { ...I, inspected_at: "21 Sep 2026, 09:10", odometer: 84890, fuel_pct: 70, new_damage: false, notes: "Returned clean. Fuel slightly below pickup level." },
    html: (d, t) => [
      badge(d.new_damage ? "⚠️ Return inspection — damage noted" : "✅ Return inspection — all clear", d.new_damage ? "warning" : "success"),
      greeting(t, d.first_name),
      p(`The return inspection for booking <strong>#${esc(d.booking_id)}</strong> is complete.`),
      inspectionCard(d),
      d.notes ? alert(`<strong>Notes:</strong> ${esc(d.notes)}`, d.new_damage ? "warning" : "info") : "",
      d.new_damage ? p("If you disagree with anything in this report you can open a dispute within 48 hours.", { small: true }) : "",
      button("View Full Report →", url("/dashboard/bookings"), "navy"),
      signature(t),
    ].join(""),
  }),

  "damage-claim-opened": defineTemplate({
    name: "Damage claim opened", category: "inspections",
    subject: (d) => `Damage Claim Opened — ${fmtRWF(d.amount_rwf)}`,
    preheader: () => "Review the claim and respond within 48 hours.",
    sample: { ...I, amount_rwf: 85000, claim_id: "CLM-0017", description: "Rear bumper scratch, 15cm, not present in pickup photos.", respond_by: "23 Sep 2026" },
    html: (d, t) => [
      badge("⚠️ Damage claim", "warning"),
      h1(`Claim #${esc(d.claim_id)}`),
      p(`The owner of <strong>${esc(d.car_name)}</strong> has opened a damage claim on booking #${esc(d.booking_id)}.`),
      infoCard("", [["Amount claimed", fmtRWF(d.amount_rwf), { strong: true, color: "#EF4444" }], ["Description", esc(d.description)], ["Respond by", esc(d.respond_by)]]),
      alert("You can <strong>accept</strong> the claim, <strong>dispute</strong> it with your own evidence, or <strong>request mediation</strong> from LORA. Pickup and return photos are attached to the case automatically.", "info"),
      button("Review Claim →", url("/dashboard/bookings"), "navy"),
      signature(t),
    ].join(""),
  }),
};
