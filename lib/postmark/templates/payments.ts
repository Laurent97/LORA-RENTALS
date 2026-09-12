import { defineTemplate } from "../types";
import { url } from "../config";
import { alert, badge, button, esc, fmtRWF, greeting, h1, infoCard, p, signature, stats, totalRow } from "../layout/components";

const P = {
  first_name: "Aline",
  booking_id: "LR-7F3A2C",
  car_name: "Toyota Land Cruiser Prado 2021",
  amount_rwf: 255000,
  amount_usd: 196,
  payment_method: "MTN MoMo",
  paid_at: "18 Sep 2026, 09:14",
  reference: "MP260918.0914.A1B2C3",
  receipt_url: url("/dashboard/bookings"),
};

export const payments = {
  "payment-received-office": defineTemplate({
    name: "Payment received", category: "payments",
    subject: () => "Payment Received — Thank You! 🧾",
    preheader: (d) => `${fmtRWF(d.amount_rwf)} received via ${d.payment_method}.`,
    sample: P,
    html: (d, t) => [
      badge("✅ Payment received", "success"),
      h1(`Thank you, ${esc(d.first_name)}!`, { center: true }),
      p(`We've received your payment for booking <strong>#${esc(d.booking_id)}</strong>.`, { center: true }),
      infoCard(esc(d.car_name), [
        ["Method", esc(d.payment_method)],
        ["Reference", `<span style="font-family:'Courier New',monospace;">${esc(d.reference)}</span>`],
        ["Paid at", esc(d.paid_at)],
        ["Booking fee", "RWF 0", { color: "#10B981", strong: true }],
      ], totalRow("💰 Amount", d.amount_rwf, `≈ ${d.amount_usd} USD`)),
      button("View Receipt →", d.receipt_url),
      signature(t),
    ].join(""),
  }),

  "payment-receipt-pdf": defineTemplate({
    name: "Official receipt (PDF)", category: "payments",
    subject: () => "Your Official LORA Receipt",
    preheader: () => "Your tax-compliant receipt is attached.",
    sample: { ...P, receipt_number: "RCT-2026-000481" },
    html: (d, t) => [
      badge("🧾 Official receipt", "navy"),
      greeting(t, d.first_name),
      p(`Attached is your official receipt <strong>${esc(d.receipt_number)}</strong> for booking #${esc(d.booking_id)}.`),
      infoCard("", [
        ["Receipt no.", esc(d.receipt_number)],
        ["Booking", `#${esc(d.booking_id)}`],
        ["Vehicle", esc(d.car_name)],
        ["Method", esc(d.payment_method)],
        ["Date", esc(d.paid_at)],
      ], totalRow("Total", d.amount_rwf)),
      p("📎 The PDF is attached to this email. You can also download it anytime from your dashboard.", { muted: true, small: true }),
      button("Open Dashboard →", d.receipt_url, "navy"),
      signature(t),
    ].join(""),
  }),

  "payment-outstanding": defineTemplate({
    name: "Outstanding balance", category: "payments",
    subject: () => "Reminder: Outstanding Balance",
    preheader: (d) => `${fmtRWF(d.amount_rwf)} due for booking #${d.booking_id}.`,
    sample: { ...P, due_date: "25 Sep 2026" },
    html: (d, t) => [
      badge("⚠️ Balance due", "warning"),
      greeting(t, d.first_name),
      p(`A balance of <strong>${fmtRWF(d.amount_rwf)}</strong> is outstanding for booking <strong>#${esc(d.booking_id)}</strong> (${esc(d.car_name)}).`),
      alert(`Please settle by <strong>${esc(d.due_date)}</strong> at any LORA office — cash, MTN MoMo or card.`, "warning"),
      infoCard("", [["MoMo Pay", "*182*8*1*XXXXXX#"], ["Office", "KG 7 Ave, Kigali Heights"], ["Hours", "Mon–Sat, 08:00–18:00"]]),
      button("View Booking →", d.receipt_url),
      signature(t),
    ].join(""),
  }),

  "payment-refund-initiated": defineTemplate({
    name: "Refund initiated", category: "payments",
    subject: (d) => `Refund Initiated — ${fmtRWF(d.amount_rwf)}`,
    preheader: () => "Your refund is on its way.",
    sample: { ...P, refund_method: "MTN MoMo", eta: "1–3 business days" },
    html: (d, t) => [
      badge("↩️ Refund initiated", "info"),
      greeting(t, d.first_name),
      p(`We've started a refund of <strong>${fmtRWF(d.amount_rwf)}</strong> for booking #${esc(d.booking_id)}.`),
      infoCard("", [["Refund to", esc(d.refund_method)], ["Expected in", esc(d.eta)], ["Reference", `<span style="font-family:'Courier New',monospace;">${esc(d.reference)}</span>`]]),
      p("We'll email you again once it's completed.", { muted: true, small: true }),
      signature(t),
    ].join(""),
  }),

  "payment-refund-completed": defineTemplate({
    name: "Refund completed", category: "payments",
    subject: () => "Refund Completed ✅",
    preheader: (d) => `${fmtRWF(d.amount_rwf)} has been returned to you.`,
    sample: { ...P, refund_method: "MTN MoMo" },
    html: (d, t) => [
      badge("✅ Refund complete", "success"),
      greeting(t, d.first_name),
      p(`<strong>${fmtRWF(d.amount_rwf)}</strong> has been refunded to your ${esc(d.refund_method)} for booking #${esc(d.booking_id)}.`),
      p("Thank you for your patience — we hope to see you on the road again soon.", { muted: true }),
      button("Browse Cars →", url("/browse")),
      signature(t),
    ].join(""),
  }),

  "payment-owner-payout": defineTemplate({
    name: "Owner payout", category: "payments",
    subject: (d) => `Your Payout Is Ready — ${fmtRWF(d.payout_rwf)}`,
    preheader: () => "Earnings from your completed trips have been sent.",
    sample: { first_name: "Jean-Paul", payout_rwf: 448800, gross_rwf: 510000, commission_rwf: 61200, trips: 2, period: "1–15 Sep 2026", payout_method: "MTN MoMo · 078X XXX XXX", payout_date: "16 Sep 2026" },
    html: (d, t) => [
      badge("💸 Payout sent", "gold"),
      h1(`Your earnings are on the way, ${esc(d.first_name)}!`, { center: true }),
      stats([
        { label: "Gross", value: fmtRWF(d.gross_rwf) },
        { label: "Commission (12%)", value: `−${fmtRWF(d.commission_rwf)}`, color: "#6B7280" },
        { label: "Payout", value: fmtRWF(d.payout_rwf), color: "#10B981" },
      ]),
      infoCard("", [["Period", esc(d.period)], ["Trips", String(d.trips)], ["Paid to", esc(d.payout_method)], ["Date", esc(d.payout_date)]]),
      button("View Earnings →", url("/owner/earnings"), "navy"),
      signature(t),
    ].join(""),
  }),
};
