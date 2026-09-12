import { defineTemplate } from "../types";
import { url } from "../config";
import { alert, badge, banner, button, esc, fmtRWF, h1, infoCard, p, signature, stats } from "../layout/components";

const A = { booking_id: "LR-7F3A2C", car_name: "Toyota Land Cruiser Prado 2021", customer_name: "Aline M.", owner_name: "Jean-Paul K.", total_rwf: 255000, pickup_date: "18 Sep 2026, 09:00", return_date: "21 Sep 2026, 09:00" };

export const admin = {
  "admin-new-booking": defineTemplate({
    name: "[Admin] New booking", category: "admin",
    subject: (d) => `[Admin] New Booking — ${d.car_name}`,
    preheader: (d) => `${d.customer_name} → ${d.owner_name} · ${fmtRWF(d.total_rwf)}`,
    sample: A,
    html: (d) => [
      badge("New booking", "navy"),
      h1(`#${esc(d.booking_id)} — ${esc(d.car_name)}`),
      infoCard("", [["Customer", esc(d.customer_name)], ["Owner", esc(d.owner_name)], ["Dates", `${esc(d.pickup_date)} → ${esc(d.return_date)}`], ["Total", fmtRWF(d.total_rwf), { strong: true }]]),
      button("Open in Admin →", url("/admin/bookings"), "navy"),
    ].join(""),
  }),

  "admin-new-user": defineTemplate({
    name: "[Admin] New user", category: "admin",
    subject: (d) => `[Admin] New ${d.role} — ${d.name}`,
    preheader: (d) => `${d.email} just registered.`,
    sample: { role: "owner", name: "Jean-Paul K.", email: "jp@example.com", phone: "+250 78X XXX XXX", referred_by: "LORA-ALINE" },
    html: (d) => [
      badge(`New ${esc(d.role)}`, "navy"),
      h1(esc(d.name)),
      infoCard("", [["Email", esc(d.email)], ["Phone", esc(d.phone)], ["Role", esc(d.role)], ["Referred by", esc(d.referred_by || "—")]]),
      button("View Users →", url("/admin/users"), "navy"),
    ].join(""),
  }),

  "admin-dispute-raised": defineTemplate({
    name: "[Admin] Dispute raised", category: "admin",
    subject: (d) => `[Admin] 🚨 Dispute — #${d.case_id}`,
    preheader: (d) => `${d.raised_by} on booking #${d.booking_id}`,
    sample: { ...A, case_id: "DSP-0042", raised_by: "Aline M. (customer)", category: "Damage claim", summary: "Owner claims a scratch on the rear bumper that was already present at pickup." },
    html: (d) => [
      banner("🚨 Dispute raised", `Case #${esc(d.case_id)} · respond within 24h`, "warning"),
      infoCard("", [["Booking", `#${esc(d.booking_id)}`], ["Vehicle", esc(d.car_name)], ["Raised by", esc(d.raised_by)], ["Category", esc(d.category), { strong: true }]]),
      alert(esc(d.summary), "info"),
      button("Review Case →", url("/admin/bookings"), "red"),
    ].join(""),
  }),

  "admin-sos-alert": defineTemplate({
    name: "[URGENT] SOS alert", category: "admin",
    subject: (d) => `[URGENT] 🆘 SOS Alert — ${d.customer_name}`,
    preheader: (d) => `${d.sos_type} · ${d.lat}, ${d.lng}`,
    sample: { ...A, customer_phone: "+250 78X XXX XXX", sos_type: "Breakdown", lat: -1.9536, lng: 30.0605, timestamp: "12 Sep 2026, 14:32", alert_id: "sos-demo" },
    html: (d) => [
      banner("🆘 EMERGENCY SOS ALERT", "Immediate attention required", "error"),
      h1(`${esc(d.customer_name)} triggered an SOS`),
      infoCard("", [
        ["Type", esc(d.sos_type), { strong: true, color: "#EF4444" }],
        ["Booking", `#${esc(d.booking_id)}`],
        ["Vehicle", esc(d.car_name)],
        ["Phone", `<a href="tel:${esc(String(d.customer_phone).replace(/\s/g, ""))}" style="color:#0A1F44;">${esc(d.customer_phone)}</a>`],
        ["Location", `<a href="https://maps.google.com/?q=${esc(d.lat)},${esc(d.lng)}" style="color:#0A1F44;">${esc(d.lat)}, ${esc(d.lng)} ↗</a>`],
        ["Time", esc(d.timestamp)],
      ]),
      button("Open Alert in Admin →", url("/admin/sos"), "red"),
      p("🇷🇼 Rwanda emergency: Police <strong>112</strong> · Ambulance <strong>912</strong> · Fire <strong>111</strong>", { muted: true, small: true, center: true }),
    ].join(""),
  }),

  "admin-daily-summary": defineTemplate({
    name: "[Daily] Summary", category: "admin",
    subject: (d) => `[Daily] LORA Summary — ${d.date}`,
    preheader: (d) => `${d.bookings} bookings · ${fmtRWF(d.revenue_rwf)} · ${d.new_users} new users`,
    sample: { date: "12 Sep 2026", bookings: 14, revenue_rwf: 3120000, new_users: 9, new_listings: 3, pending_kyc: 4, open_sos: 0, sla_breaches: 1 },
    html: (d) => [
      badge(`📊 ${esc(d.date)}`, "navy"),
      h1("Daily summary"),
      stats([
        { label: "Bookings", value: String(d.bookings) },
        { label: "Revenue", value: fmtRWF(d.revenue_rwf), color: "#10B981" },
        { label: "New users", value: String(d.new_users) },
      ]),
      infoCard("Needs attention", [
        ["Pending KYC", String(d.pending_kyc), { color: Number(d.pending_kyc) > 0 ? "#F59E0B" : "#10B981" }],
        ["SLA breaches", String(d.sla_breaches), { color: Number(d.sla_breaches) > 0 ? "#EF4444" : "#10B981" }],
        ["Open SOS", String(d.open_sos), { color: Number(d.open_sos) > 0 ? "#EF4444" : "#10B981" }],
        ["New listings", String(d.new_listings)],
      ]),
      button("Open Command Center →", url("/admin"), "navy"),
    ].join(""),
  }),

  "admin-weekly-report": defineTemplate({
    name: "[Weekly] Performance", category: "admin",
    subject: () => "[Weekly] LORA Performance Report",
    preheader: (d) => `Week ${d.week}: ${d.bookings} bookings, ${d.growth_pct}% growth.`,
    sample: { week: "37", bookings: 86, revenue_rwf: 19400000, growth_pct: 12, avg_response_min: 48, top_car: "Toyota RAV4 2022", top_location: "Kigali International Airport", nps: 71 },
    html: (d) => [
      badge(`📈 Week ${esc(d.week)}`, "navy"),
      h1("Weekly performance"),
      stats([
        { label: "Bookings", value: String(d.bookings) },
        { label: "Revenue", value: fmtRWF(d.revenue_rwf), color: "#10B981" },
        { label: "Growth", value: `${Number(d.growth_pct) >= 0 ? "+" : ""}${d.growth_pct}%`, color: Number(d.growth_pct) >= 0 ? "#10B981" : "#EF4444" },
      ]),
      infoCard("Highlights", [["Avg owner response", `${d.avg_response_min} min`], ["Top vehicle", esc(d.top_car)], ["Top pickup point", esc(d.top_location)], ["NPS", String(d.nps)]]),
      button("Full Analytics →", url("/admin"), "navy"),
    ].join(""),
  }),

  "admin-sla-breach": defineTemplate({
    name: "[Admin] SLA breach", category: "admin",
    subject: (d) => `[Admin] Owner SLA Breached — #${d.booking_id}`,
    preheader: (d) => `${d.owner_name} did not respond within 4h.`,
    sample: { ...A, requested_at: "12 Sep 2026, 08:00", owner_phone: "+250 78X XXX XXX" },
    html: (d, t) => [
      banner("⏰ SLA breached", "Owner did not respond within 4 hours", "warning"),
      infoCard("", [["Booking", `#${esc(d.booking_id)}`], ["Owner", esc(d.owner_name)], ["Owner phone", esc(d.owner_phone)], ["Customer", esc(d.customer_name)], ["Requested", esc(d.requested_at)]]),
      p("Suggested action: call the owner, then offer the customer alternatives if no answer within 30 minutes.", { small: true }),
      button(t.openAdmin, url("/admin/bookings"), "navy"),
      signature(t),
    ].join(""),
  }),
};
