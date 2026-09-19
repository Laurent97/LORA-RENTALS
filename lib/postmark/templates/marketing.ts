import { defineTemplate } from "../types";
import { url } from "../config";
import { alert, badge, button, carImage, esc, featureGrid, fmtRWF, greeting, h1, infoCard, p, signature } from "../layout/components";

const HERO = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1072&q=80";

export const marketing = {
  "marketing-welcome-series-1": defineTemplate({
    name: "Welcome series #1", category: "marketing", stream: "broadcast",
    subject: () => "Meet LORA — Premium Cars, Zero Booking Fees 🚗",
    preheader: () => "How LORA works, in 60 seconds.",
    sample: { first_name: "Aline" },
    html: (d, t) => [
      carImage(HERO, "Driving through Rwanda"),
      h1(`Hi ${esc(d.first_name)}, here's how LORA works`),
      featureGrid([
        { icon: "🔍", title: "Search in plain language", body: "“4x4 in Musanze next weekend” — our AI does the rest." },
        { icon: "✅", title: "Verified owners only", body: "Every owner is KYC-checked. Look for the blue badge." },
        { icon: "💵", title: "Pay at pickup", body: "Cash, MoMo or card. No deposit online, RWF 0 booking fee." },
        { icon: "📱", title: "QR handover", body: "Scan, sign, drive. No paperwork." },
      ]),
      button(t.browseCars, url("/browse")),
      signature(t),
    ].join(""),
  }),

  "marketing-weekly-deals": defineTemplate({
    name: "Weekly deals", category: "marketing", stream: "broadcast",
    subject: () => "This Week's Best Car Deals in Rwanda 🇷🇼",
    preheader: () => "Hand-picked cars from top-rated owners.",
    sample: { first_name: "Aline", car1: "Toyota RAV4 2022 — Kigali", price1: 65000, car2: "Suzuki Jimny 2023 — Musanze", price2: 55000, car3: "Mercedes C200 — Kigali", price3: 120000 },
    html: (d, t) => [
      badge("🔥 This week", "gold"),
      h1("Top picks for your next trip", { center: true }),
      infoCard("", [
        [esc(d.car1), `${fmtRWF(d.price1)}/day`, { strong: true }],
        [esc(d.car2), `${fmtRWF(d.price2)}/day`, { strong: true }],
        [esc(d.car3), `${fmtRWF(d.price3)}/day`, { strong: true }],
      ]),
      p("All from verified owners · Pay at pickup · RWF 0 booking fee", { muted: true, small: true, center: true }),
      button("See All Deals →", url("/browse")),
      signature(t),
    ].join(""),
  }),

  "marketing-blog-digest": defineTemplate({
    name: "Blog digest", category: "marketing", stream: "broadcast",
    subject: (d) => `${d.post_title} — Read Now`,
    preheader: (d) => String(d.post_excerpt),
    sample: { first_name: "Aline", post_title: "Top 10 Drives in Rwanda", post_excerpt: "From the Congo Nile Trail to the Akagera loop — the most scenic roads and the right car for each.", post_url: url("/blog/top-10-drives-in-rwanda"), post_image: HERO },
    html: (d, t) => [
      badge("📖 From the blog", "navy"),
      carImage(d.post_image, d.post_title),
      h1(esc(d.post_title)),
      p(esc(d.post_excerpt)),
      button("Read the Article →", d.post_url, "navy"),
      signature(t),
    ].join(""),
  }),

  "marketing-birthday": defineTemplate({
    name: "Birthday", category: "marketing", stream: "broadcast",
    subject: (d) => `Happy Birthday, ${d.first_name}! 🎂 A Gift Inside`,
    preheader: () => "Bonus LORA Points, on us.",
    sample: { first_name: "Aline", bonus_points: 500 },
    html: (d, t) => [
      badge("🎂 Happy birthday", "gold"),
      h1(`Happy Birthday, ${esc(d.first_name)}!`, { center: true }),
      p("Wishing you a year of great roads and better company. Here's a little something from us:", { center: true }),
      alert(`🎁 <strong>${esc(d.bonus_points)} bonus LORA Points</strong> have been added to your account — worth ${fmtRWF(Number(d.bonus_points) * 10)} at checkout.`, "gold"),
      button("Plan a Birthday Trip →", url("/browse")),
      signature(t, true),
    ].join(""),
  }),

  "marketing-reengagement": defineTemplate({
    name: "Re-engagement", category: "marketing", stream: "broadcast",
    subject: () => "We Miss You — Here's 10% Off",
    preheader: () => "Come back and save on your next rental.",
    sample: { first_name: "Aline", promo_code: "COMEBACK10", expires: "30 Sep 2026" },
    html: (d, t) => [
      greeting(t, d.first_name),
      p("It's been a while! New cars have joined LORA since your last trip — including airport-approved SUVs and luxury sedans."),
      infoCard("Your code", [["Discount", "10% off", { strong: true, color: "#10B981" }], ["Code", `<span style="font-family:'Courier New',monospace;font-weight:700;letter-spacing:2px;">${esc(d.promo_code)}</span>`], ["Expires", esc(d.expires)]]),
      button("Book & Save →", url("/browse")),
      signature(t),
    ].join(""),
  }),

  "broadcast-admin": defineTemplate({
    name: "Admin broadcast", category: "marketing", stream: "broadcast",
    subject: (d) => String(d.title ?? "News from LORA Rentals"),
    preheader: (d) => String(d.body ?? "").slice(0, 120),
    sample: { first_name: "Aline", title: "🔴 We're LIVE on TikTok now!", body: "Join us for a free training on earning more with your car.", cta_label: "Join Live", cta_url: "https://tiktok.com/@lorarentals/live" },
    html: (d, t) => [
      greeting(t, d.first_name),
      h1(esc(d.title)),
      p(esc(d.body)),
      ...(d.cta_url && d.cta_label ? [button(esc(d.cta_label), String(d.cta_url))] : []),
      signature(t),
    ].join(""),
  }),
};
