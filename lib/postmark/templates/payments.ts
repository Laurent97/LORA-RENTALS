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
  receipt_url: url("/api/receipts/LRA-7F3A2C"),
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
      button("View Receipt →", url(`/api/receipts/${esc(d.booking_id)}`)),
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
      button("Download Receipt →", url(`/api/receipts/${esc(d.booking_id)}`), "navy"),
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

  "payment-initiated": defineTemplate({
    name: "Payment initiated", category: "payments",
    subject: () => "Payment Initiated — Complete on Your Phone",
    preheader: (d) => `Complete your ${fmtRWF(d.amount_rwf)} LORA payment on your phone.`,
    sample: { ...P, ussd_code: "*182*1*1*0781234567*5000#" },
    html: (d, t) => [badge("📱 Payment started", "gold"), greeting(t, d.first_name), p(`Your payment of <strong>${fmtRWF(d.amount_rwf)}</strong> for booking #${esc(d.booking_id)} is ready.`), infoCard("Dial from your Rwanda SIM", [["USSD code", `<span style="font-family:'Courier New',monospace;">${esc(d.ussd_code)}</span>`], ["Booking fee", "RWF 0"]]), p("Open the dialer, tap Call, and enter your Mobile Money PIN. LORA never receives your PIN.", { muted: true }), signature(t)].join(""),
  }),

  "payment-awaiting-pin": defineTemplate({
    name: "Payment awaiting PIN", category: "payments",
    subject: () => "Enter Your PIN to Complete Payment",
    preheader: () => "Your LORA payment is waiting for PIN entry.",
    sample: { ...P, minutes_left: 3 },
    html: (d, t) => [badge("⏳ Payment waiting", "warning"), greeting(t, d.first_name), p(`Your ${fmtRWF(d.amount_rwf)} payment for booking #${esc(d.booking_id)} has not been completed yet.`), alert("Open your Mobile Money prompt and enter your PIN before the payment expires.", "warning"), button("Return to payment →", d.receipt_url), signature(t)].join(""),
  }),

  "payment-failed": defineTemplate({
    name: "Payment failed", category: "payments",
    subject: () => "Payment Failed — Try Again",
    preheader: (d) => `Your ${fmtRWF(d.amount_rwf)} payment needs another attempt.`,
    sample: { ...P, reason: "The provider declined the request" },
    html: (d, t) => [badge("Payment not completed", "warning"), greeting(t, d.first_name), p(`We could not confirm your payment of <strong>${fmtRWF(d.amount_rwf)}</strong> for booking #${esc(d.booking_id)}.`), infoCard("What happened", [["Reason", esc(d.reason)], ["Booking fee", "RWF 0"]]), button("Try payment again →", d.receipt_url), signature(t)].join(""),
  }),

  "payment-timeout": defineTemplate({
    name: "Payment timeout", category: "payments",
    subject: () => "Payment Timed Out — Retry Available",
    preheader: () => "Your LORA payment window expired without confirmation.",
    sample: { ...P },
    html: (d, t) => [badge("⌛ Payment expired", "warning"), greeting(t, d.first_name), p(`The payment window for booking #${esc(d.booking_id)} expired. No booking fee was charged.`), button("Retry payment →", d.receipt_url), signature(t)].join(""),
  }),

  "payment-partial-received": defineTemplate({
    name: "Partial payment received", category: "payments",
    subject: () => "Deposit Received — Balance Due at Pickup",
    preheader: (d) => `${fmtRWF(d.amount_rwf)} received. Your remaining balance is ${fmtRWF(d.balance_rwf)}.`,
    sample: { ...P, balance_rwf: 120000 },
    html: (d, t) => [badge("✅ Deposit received", "success"), greeting(t, d.first_name), p(`We received your deposit for booking #${esc(d.booking_id)}.`), infoCard(esc(d.car_name), [["Deposit", fmtRWF(d.amount_rwf)], ["Balance at pickup", fmtRWF(d.balance_rwf)], ["Booking fee", "RWF 0"]]), button("View booking →", d.receipt_url), signature(t)].join(""),
  }),

  "admin-payment-manual-review": defineTemplate({
    name: "Admin manual payment review", category: "payments",
    subject: () => "[Admin] Manual Payment Review Needed",
    preheader: (d) => `Review ${fmtRWF(d.amount_rwf)} for booking #${d.booking_id}.`,
    sample: { ...P, customer_phone: "078 123 4567" },
    html: (d, t) => [badge("Manual review needed", "warning"), h1("Payment requires review", { center: true }), p(`A customer marked a <strong>${fmtRWF(d.amount_rwf)}</strong> payment as completed for booking #${esc(d.booking_id)}.`), infoCard("Payment details", [["Customer", esc(d.first_name)], ["Phone", esc(d.customer_phone)], ["Provider", esc(d.payment_method)]]), button("Open payment dashboard →", d.receipt_url, "navy"), signature(t)].join(""),
  }),
};
