import { defineTemplate } from "../types";
import { url } from "../config";
import { alert, badge, button, esc, greeting, infoCard, p, quote, signature, timeline } from "../layout/components";

const D = { first_name: "Aline", case_id: "DSP-0042", booking_id: "LR-7F3A2C", category: "Damage claim", summary: "Owner claims a scratch on the rear bumper that was already present at pickup." };
const CASE_STEPS = ["Opened", "Under review", "Resolved"] as const;

export const disputes = {
  "dispute-opened": defineTemplate({
    name: "Dispute opened", category: "disputes",
    subject: (d) => `We've Received Your Report — Case #${d.case_id}`,
    preheader: () => "A LORA specialist will review within 24 hours.",
    sample: D,
    html: (d, t) => [
      badge("📋 Case opened", "info"),
      greeting(t, d.first_name),
      p(`Thank you for letting us know. We've opened case <strong>#${esc(d.case_id)}</strong> and a LORA specialist will review it within <strong>24 hours</strong>.`),
      infoCard("", [["Case", `#${esc(d.case_id)}`], ["Booking", `#${esc(d.booking_id)}`], ["Category", esc(d.category)]]),
      quote(esc(d.summary)),
      timeline(CASE_STEPS, 0),
      alert("💡 Pickup and return inspection photos are automatically attached to your case.", "info"),
      button("View Case →", url("/dashboard/bookings"), "navy"),
      signature(t),
    ].join(""),
  }),

  "dispute-update": defineTemplate({
    name: "Dispute update", category: "disputes",
    subject: (d) => `Update on Your Case #${d.case_id}`,
    preheader: (d) => String(d.update).slice(0, 90),
    sample: { ...D, update: "We've reviewed both inspection reports and contacted the owner for their statement. We expect to resolve this within 2 business days.", agent: "Claudine, LORA Support" },
    html: (d, t) => [
      badge("🔄 Case update", "info"),
      greeting(t, d.first_name),
      p(`There's an update on case <strong>#${esc(d.case_id)}</strong>:`),
      quote(esc(d.update), esc(d.agent)),
      timeline(CASE_STEPS, 1),
      p("Reply to this email to add information to your case.", { muted: true, small: true }),
      signature(t),
    ].join(""),
  }),

  "dispute-resolved": defineTemplate({
    name: "Dispute resolved", category: "disputes",
    subject: (d) => `Case #${d.case_id} Resolved ✅`,
    preheader: (d) => `Outcome: ${d.outcome}`,
    sample: { ...D, outcome: "No charge — pre-existing damage confirmed by pickup photos.", agent: "Claudine, LORA Support" },
    html: (d, t) => [
      badge("✅ Resolved", "success"),
      greeting(t, d.first_name),
      p(`Case <strong>#${esc(d.case_id)}</strong> has been resolved.`),
      alert(`<strong>Outcome:</strong> ${esc(d.outcome)}`, "success"),
      timeline(CASE_STEPS, 2),
      p(`If you have questions about this decision, reply within 7 days and ${esc(d.agent)} will follow up.`, { small: true }),
      signature(t),
    ].join(""),
  }),

  "support-ticket-created": defineTemplate({
    name: "Support ticket created", category: "disputes",
    subject: (d) => `Support Ticket #${d.ticket_id} Created`,
    preheader: () => "We'll reply within 24 hours.",
    sample: { first_name: "Aline", ticket_id: "TK-1187", subject_line: "Can I extend my rental by one day?", message: "Hi, I'd like to keep the Prado until Tuesday morning if possible." },
    html: (d, t) => [
      badge("🎫 Ticket created", "navy"),
      greeting(t, d.first_name),
      p(`We've received your message and created ticket <strong>#${esc(d.ticket_id)}</strong>. Our team replies within 24 hours — usually much faster.`),
      infoCard(esc(d.subject_line), []),
      quote(esc(d.message)),
      p("For anything urgent, WhatsApp us — we're online 07:00–22:00 CAT.", { muted: true, small: true }),
      signature(t),
    ].join(""),
  }),

  "support-ticket-reply": defineTemplate({
    name: "Support ticket reply", category: "disputes",
    subject: (d) => `Re: Ticket #${d.ticket_id} — ${d.subject_line}`,
    preheader: (d) => String(d.reply).slice(0, 90),
    sample: { first_name: "Aline", ticket_id: "TK-1187", subject_line: "Can I extend my rental by one day?", reply: "Good news — the owner confirmed the Prado is free until Tuesday. I've extended your booking and updated the total. No action needed.", agent: "Claudine, LORA Support" },
    html: (d, t) => [
      badge("💬 New reply", "navy"),
      greeting(t, d.first_name),
      quote(esc(d.reply), esc(d.agent)),
      p("Reply to this email to continue the conversation.", { muted: true, small: true }),
      button("View Ticket →", url("/dashboard"), "navy"),
      signature(t),
    ].join(""),
  }),
};
