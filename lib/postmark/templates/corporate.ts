import { defineTemplate } from "../types";
import { url } from "../config";
import { alert, badge, button, esc, featureGrid, fmtRWF, greeting, h1, infoCard, p, signature, stats, totalRow } from "../layout/components";

export const corporate = {
  "corporate-welcome": defineTemplate({
    name: "Corporate welcome", category: "corporate",
    subject: () => "Welcome to LORA Business 🏢",
    preheader: (d) => `${d.company_name} is approved — invite your team.`,
    sample: { contact_name: "Diane", company_name: "Kigali Tech Ltd", credit_terms: "Net 30", account_url: url("/corporate") },
    html: (d, t) => [
      badge("🏢 Account approved", "gold"),
      h1(`Welcome, ${esc(d.company_name)}!`, { center: true }),
      p(`Hi ${esc(d.contact_name)} — your LORA Business account is approved on <strong>${esc(d.credit_terms)}</strong> terms.`, { center: true }),
      featureGrid([
        { icon: "👥", title: "Invite your team", body: "Members book under the company account — no personal payments." },
        { icon: "🧾", title: "One monthly invoice", body: "Consolidated, VAT-compliant, delivered on the 1st." },
        { icon: "📊", title: "Spend dashboard", body: "Trips, spend and utilisation by team member." },
        { icon: "✈️", title: "Priority airport pickup", body: "Meet & greet for visiting colleagues." },
      ]),
      button("Open Business Dashboard →", d.account_url),
      signature(t),
    ].join(""),
  }),

  "corporate-monthly-invoice": defineTemplate({
    name: "Monthly invoice", category: "corporate",
    subject: (d) => `Your LORA Invoice — ${d.month}`,
    preheader: (d) => `${fmtRWF(d.total_rwf)} · due ${d.due_date}`,
    sample: { contact_name: "Diane", company_name: "Kigali Tech Ltd", month: "August 2026", invoice_number: "INV-2026-0081", trips: 12, members_active: 5, subtotal_rwf: 2850000, vat_rwf: 513000, total_rwf: 3363000, due_date: "30 Sep 2026", invoice_url: url("/corporate") },
    html: (d, t) => [
      badge("🧾 Invoice", "navy"),
      greeting(t, d.contact_name),
      p(`Here is the <strong>${esc(d.month)}</strong> invoice for <strong>${esc(d.company_name)}</strong>. A PDF is attached.`),
      stats([{ label: "Trips", value: String(d.trips) }, { label: "Active members", value: String(d.members_active) }, { label: "Due", value: esc(d.due_date), color: "#F59E0B" }]),
      infoCard(esc(d.invoice_number), [["Subtotal", fmtRWF(d.subtotal_rwf)], ["VAT (18%)", fmtRWF(d.vat_rwf)]], totalRow("Total due", d.total_rwf)),
      alert("Pay by bank transfer or MTN MoMo using the invoice number as reference. Details are on the PDF.", "info"),
      button("View Invoice →", d.invoice_url, "navy"),
      signature(t),
    ].join(""),
  }),

  "corporate-member-invite": defineTemplate({
    name: "Member invite", category: "corporate",
    subject: (d) => `You've Been Added to ${d.company_name}`,
    preheader: () => "Book premium cars on your company account.",
    sample: { first_name: "Eric", company_name: "Kigali Tech Ltd", invited_by: "Diane U.", accept_url: url("/register?corp=demo") },
    html: (d, t) => [
      badge("👥 Team invite", "gold"),
      greeting(t, d.first_name),
      p(`<strong>${esc(d.invited_by)}</strong> added you to <strong>${esc(d.company_name)}</strong>'s LORA Business account. You can now book cars for work trips — billed to the company, no personal payment needed.`),
      button("Accept & Start Booking →", d.accept_url),
      p("Personal trips? Keep using your own account — just switch profiles at checkout.", { muted: true, small: true }),
      signature(t),
    ].join(""),
  }),
};
