import { defineTemplate } from "../types";
import { EMAIL, url } from "../config";
import {
  alert, badge, button, divider, esc, greeting, h2, infoCard, p, quote, questions, signature, stars, stats,
} from "../layout/components";

// ─── Review & reply templates (15) ───────────────────────────────────────────
// Shared data fields: customer_name, owner_name, vehicle_name, rating,
// review_title, review_excerpt, reply_excerpt, booking_ref, review_url, reason.

const base = {
  customer_name: "Diane Ingabire",
  owner_name: "Aline Uwase",
  vehicle_name: "Toyota Corolla 2021",
  rating: 5,
  review_title: "Seamless airport pickup",
  review_excerpt: "The Corolla was spotless and the owner was waiting when I landed.",
  reply_excerpt: "Thank you Diane! Always a pleasure hosting you.",
  booking_ref: "LRA-BK1002",
  review_url: url("/cars/veh-5#reviews"),
  reason: "Policy violation",
};

export const reviews = {
  // 1. Customer — leave a review after trip completion
  "review-request": defineTemplate({
    name: "Review request (post-trip)",
    category: "reviews",
    subject: (d) => `How was your ${d.vehicle_name}? ⭐`,
    preheader: () => "60 seconds to help the next traveler pick a great ride.",
    html: (d, t) => `
      ${greeting(t, String(d.customer_name))}
      ${p(`Your trip with the <strong>${esc(d.vehicle_name)}</strong> (${esc(d.booking_ref)}) is complete — we hope it was a great one.`)}
      ${p("Your honest review helps other Rwandan travelers choose the best cars, and helps great owners get noticed.")}
      ${button("Leave a review ⭐", String(d.review_url))}
      ${p("It takes about a minute — rate, write a line or two, add photos if you like.", { muted: true, small: true })}
      ${signature(t, true)}`,
    sample: { ...base },
  }),

  // 2. Customer — review published confirmation
  "review-published-customer": defineTemplate({
    name: "Review published (customer)",
    category: "reviews",
    subject: () => "Your review is live ⭐",
    preheader: () => "Thanks for sharing your experience.",
    html: (d, t) => `
      ${greeting(t, String(d.customer_name))}
      ${badge("Published", "success")}
      ${p(`Your review of the <strong>${esc(d.vehicle_name)}</strong> is now live on LORA.`)}
      ${infoCard("Your review", [
        ["Rating", stars(Number(d.rating))],
        ["Booking", esc(d.booking_ref)],
      ], quote(String(d.review_excerpt)))}
      ${button("View your review", String(d.review_url), "navy")}
      ${p("You can edit it once within 7 days — until the owner replies.", { muted: true, small: true })}
      ${signature(t)}`,
    sample: { ...base },
  }),

  // 3. Owner — new review on their vehicle
  "review-new-owner": defineTemplate({
    name: "New review (owner)",
    category: "reviews",
    subject: (d) => `New ${d.rating}★ review on your ${d.vehicle_name}`,
    preheader: (d) => `${d.customer_name} just reviewed your car — reply to build trust.`,
    html: (d, t) => `
      ${greeting(t, String(d.owner_name))}
      ${p(`<strong>${esc(d.customer_name)}</strong> left a review on your <strong>${esc(d.vehicle_name)}</strong>.`)}
      ${infoCard("Review", [
        ["Rating", stars(Number(d.rating))],
        ["Customer", esc(d.customer_name)],
        ["Booking", esc(d.booking_ref)],
      ], quote(String(d.review_excerpt)))}
      ${button("Reply to this review", url("/owner/reviews"))}
      ${p("Owners who reply get more bookings — a quick thank-you goes a long way.", { muted: true, small: true })}
      ${signature(t)}`,
    sample: { ...base },
  }),

  // 4. Customer — owner replied to their review
  "review-reply-customer": defineTemplate({
    name: "Owner replied (customer)",
    category: "reviews",
    subject: (d) => `${d.owner_name} replied to your review`,
    preheader: () => "The owner responded — tap to read.",
    html: (d, t) => `
      ${greeting(t, String(d.customer_name))}
      ${p(`<strong>${esc(d.owner_name)}</strong> replied to your review of the <strong>${esc(d.vehicle_name)}</strong>.`)}
      ${quote(String(d.reply_excerpt), String(d.owner_name))}
      ${button("Read the full reply", String(d.review_url), "navy")}
      ${signature(t)}`,
    sample: { ...base },
  }),

  // 5. Admin — review flagged
  "review-flagged-admin": defineTemplate({
    name: "Review flagged (admin)",
    category: "reviews",
    subject: (d) => `🚩 Review flagged: ${d.reason}`,
    preheader: (d) => `${d.flag_count} report(s) — moderation needed.`,
    html: (d, t) => `
      ${h2("🚩 Review flagged")}
      ${infoCard("Flag details", [
        ["Reason", esc(d.reason)],
        ["Reports", String(d.flag_count)],
        ["Vehicle", esc(d.vehicle_name)],
        ["Customer", esc(d.customer_name)],
      ], quote(String(d.review_excerpt)))}
      ${button(t.openAdmin, url("/admin/reviews"), "red")}
      ${signature(t)}`,
    sample: { ...base, flag_count: 1 },
  }),

  // 6. Admin — review auto-hidden after threshold
  "review-auto-hidden-admin": defineTemplate({
    name: "Review auto-hidden (admin)",
    category: "reviews",
    subject: (d) => `⚠️ Review auto-hidden after ${d.flag_count} reports`,
    preheader: () => "A review crossed the report threshold and was hidden.",
    html: (d, t) => `
      ${h2("⚠️ Review auto-hidden")}
      ${alert(`This review reached <strong>${esc(d.flag_count)} reports</strong> and was automatically hidden pending your review.`, "warning")}
      ${infoCard("Review", [
        ["Vehicle", esc(d.vehicle_name)],
        ["Customer", esc(d.customer_name)],
        ["Latest reason", esc(d.reason)],
      ], quote(String(d.review_excerpt)))}
      ${button("Review in moderation queue", url("/admin/reviews"), "red")}
      ${signature(t)}`,
    sample: { ...base, flag_count: 3 },
  }),

  // 7. Customer — their review was hidden
  "review-hidden-customer": defineTemplate({
    name: "Review hidden (customer)",
    category: "reviews",
    subject: () => "Your review was hidden",
    preheader: () => "A moderator hid your review pending review.",
    html: (d, t) => `
      ${greeting(t, String(d.customer_name))}
      ${alert("Your review was <strong>hidden</strong> by our moderation team while we check it against our guidelines.", "warning")}
      ${infoCard("Your review", [["Vehicle", esc(d.vehicle_name)], ["Rating", stars(Number(d.rating))]], quote(String(d.review_excerpt)))}
      ${p("If you believe this was a mistake, reply to this email or contact support — we're happy to take another look.")}
      ${questions(t)}
      ${signature(t)}`,
    sample: { ...base },
  }),

  // 8. Owner — a review on their car was hidden
  "review-hidden-owner": defineTemplate({
    name: "Review hidden (owner)",
    category: "reviews",
    subject: (d) => `A review on your ${d.vehicle_name} was hidden`,
    preheader: () => "Our moderation team hid a review on your vehicle.",
    html: (d, t) => `
      ${greeting(t, String(d.owner_name))}
      ${p(`A review on your <strong>${esc(d.vehicle_name)}</strong> was hidden by our moderation team.`)}
      ${infoCard("Hidden review", [["Customer", esc(d.customer_name)], ["Rating", stars(Number(d.rating))]], quote(String(d.review_excerpt)))}
      ${p("Hidden reviews don't count toward your rating. No action needed from you.", { muted: true })}
      ${signature(t)}`,
    sample: { ...base },
  }),

  // 9. Customer — their review was deleted
  "review-deleted-customer": defineTemplate({
    name: "Review deleted (customer)",
    category: "reviews",
    subject: () => "Your review was removed",
    preheader: (d) => `Reason: ${d.reason}`,
    html: (d, t) => `
      ${greeting(t, String(d.customer_name))}
      ${alert(`Your review of the <strong>${esc(d.vehicle_name)}</strong> was permanently removed by a LORA admin.<br/><strong>Reason:</strong> ${esc(d.reason)}`, "error")}
      ${p("Reviews are removed only when they violate our content policy. If you think this was a mistake, contact support.")}
      ${questions(t)}
      ${signature(t)}`,
    sample: { ...base },
  }),

  // 10. Owner — a review on their car was deleted
  "review-deleted-owner": defineTemplate({
    name: "Review deleted (owner)",
    category: "reviews",
    subject: (d) => `A review on your ${d.vehicle_name} was removed`,
    preheader: (d) => `Reason: ${d.reason}`,
    html: (d, t) => `
      ${greeting(t, String(d.owner_name))}
      ${p(`A review on your <strong>${esc(d.vehicle_name)}</strong> was permanently removed by a LORA admin.`)}
      ${infoCard("Removed review", [
        ["Customer", esc(d.customer_name)],
        ["Rating", stars(Number(d.rating))],
        ["Reason", esc(d.reason)],
      ])}
      ${p("Removed reviews no longer affect your rating.", { muted: true })}
      ${signature(t)}`,
    sample: { ...base },
  }),

  // 11. Owner — their reply was deleted
  "reply-deleted-owner": defineTemplate({
    name: "Reply deleted (owner)",
    category: "reviews",
    subject: () => "Your reply was removed",
    preheader: (d) => `Reason: ${d.reason}`,
    html: (d, t) => `
      ${greeting(t, String(d.owner_name))}
      ${alert(`Your reply to a review on the <strong>${esc(d.vehicle_name)}</strong> was removed by a LORA admin.<br/><strong>Reason:</strong> ${esc(d.reason)}`, "error")}
      ${quote(String(d.reply_excerpt))}
      ${p("Keep replies courteous and on-topic — they're public and shape your reputation.")}
      ${signature(t)}`,
    sample: { ...base },
  }),

  // 12. Customer — their review was restored
  "review-restored-customer": defineTemplate({
    name: "Review restored (customer)",
    category: "reviews",
    subject: () => "Good news — your review is back ⭐",
    preheader: () => "Our team reviewed it and restored it.",
    html: (d, t) => `
      ${greeting(t, String(d.customer_name))}
      ${badge("Restored", "success")}
      ${p(`After a second look, your review of the <strong>${esc(d.vehicle_name)}</strong> is live again. Thanks for your patience.`)}
      ${button("View your review", String(d.review_url), "navy")}
      ${signature(t)}`,
    sample: { ...base },
  }),

  // 13. Customer — reminder to review (48h after completion)
  "review-reminder": defineTemplate({
    name: "Review reminder",
    category: "reviews",
    subject: (d) => `Still thinking about the ${d.vehicle_name}? ⭐`,
    preheader: () => "Your review takes a minute and helps the whole community.",
    html: (d, t) => `
      ${greeting(t, String(d.customer_name))}
      ${p(`A couple of days ago you returned the <strong>${esc(d.vehicle_name)}</strong> (${esc(d.booking_ref)}). If you have a minute, we'd love your honest take.`)}
      ${button("Leave a quick review", String(d.review_url))}
      ${p("No pressure — but reviews are how great owners get discovered.", { muted: true, small: true })}
      ${signature(t, true)}`,
    sample: { ...base },
  }),

  // 14. Owner — weekly review digest
  "review-weekly-digest-owner": defineTemplate({
    name: "Weekly review digest (owner)",
    category: "reviews",
    stream: "broadcast",
    subject: (d) => `Your week in reviews: ${d.total_reviews} new, ${d.avg_rating}★ avg`,
    preheader: (d) => `${d.unreplied} review(s) still waiting for your reply.`,
    html: (d, t) => `
      ${greeting(t, String(d.owner_name))}
      ${p(`Here's how your fleet did in reviews this week (${esc(d.period)}):`)}
      ${stats([
        { label: "New reviews", value: String(d.total_reviews) },
        { label: "Avg rating", value: `${d.avg_rating}★` },
        { label: "Awaiting reply", value: String(d.unreplied), color: Number(d.unreplied) > 0 ? "#D97706" : undefined },
      ])}
      ${Number(d.unreplied) > 0 ? alert(`<strong>${esc(d.unreplied)} review(s)</strong> haven't had a reply yet — owners who reply earn more bookings.`, "info") : ""}
      ${button("Open your reviews", url("/owner/reviews"))}
      ${signature(t)}`,
    sample: { ...base, period: "Sep 1 – Sep 7", total_reviews: 3, avg_rating: "4.7", unreplied: 1 },
  }),

  // 15. Owner — review milestone celebration
  "review-milestone-owner": defineTemplate({
    name: "Review milestone (owner)",
    category: "reviews",
    subject: (d) => `🏆 ${d.milestone} — your fleet is on fire`,
    preheader: () => "A milestone worth celebrating.",
    html: (d, t) => `
      ${greeting(t, String(d.owner_name))}
      ${badge("Milestone reached", "gold")}
      ${p(`<strong>${esc(d.milestone)}</strong> — customers keep choosing your cars, and the reviews prove it.`)}
      ${stats([
        { label: "Total reviews", value: String(d.total_reviews) },
        { label: "Avg rating", value: `${d.avg_rating}★` },
        { label: "Response rate", value: `${d.response_rate}%` },
      ])}
      ${divider()}
      ${p("Keep it up — top-rated owners get featured placement in search.", { muted: true })}
      ${button("See your reviews", url("/owner/reviews"), "navy")}
      ${signature(t)}`,
    sample: { ...base, milestone: "50 five-star reviews", total_reviews: 87, avg_rating: "4.8", response_rate: 92 },
  }),
} as const;
