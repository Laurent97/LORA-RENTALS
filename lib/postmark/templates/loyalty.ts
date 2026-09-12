import { defineTemplate } from "../types";
import { url } from "../config";
import { alert, badge, button, esc, featureGrid, fmtRWF, greeting, h1, infoCard, p, signature, stats } from "../layout/components";

export const loyalty = {
  "loyalty-points-earned": defineTemplate({
    name: "Points earned", category: "loyalty",
    subject: (d) => `You Earned ${d.points} LORA Points! ✨`,
    preheader: (d) => `Balance: ${d.balance} points · ${d.tier} tier.`,
    sample: { first_name: "Aline", points: 255, balance: 1240, tier: "Silver", next_tier: "Gold", to_next: 760, booking_id: "LR-7F3A2C" },
    html: (d, t) => [
      badge("✨ Points earned", "gold"),
      h1(`+${esc(d.points)} points, ${esc(d.first_name)}!`, { center: true }),
      p(`Your trip #${esc(d.booking_id)} just earned you LORA Points.`, { center: true }),
      stats([
        { label: "Earned", value: `+${d.points}`, color: "#D4AF37" },
        { label: "Balance", value: String(d.balance) },
        { label: "Tier", value: String(d.tier) },
      ]),
      alert(`🏆 Only <strong>${esc(d.to_next)} points</strong> to <strong>${esc(d.next_tier)}</strong>. Points are worth RWF 10 each at checkout.`, "gold"),
      button("View My Points →", url("/dashboard/loyalty")),
      signature(t),
    ].join(""),
  }),

  "loyalty-tier-upgrade": defineTemplate({
    name: "Tier upgrade", category: "loyalty",
    subject: (d) => `Congrats! You're Now ${d.tier} 🏆`,
    preheader: () => "New perks unlocked.",
    sample: { first_name: "Aline", tier: "Gold", perks: "Priority owner responses · 5% bonus points · Free child seat" },
    html: (d, t) => [
      badge(`🏆 ${esc(d.tier)} tier`, "gold"),
      h1(`You made ${esc(d.tier)}, ${esc(d.first_name)}!`, { center: true }),
      p("Your loyalty just levelled up. Here's what's now unlocked:", { center: true }),
      featureGrid(String(d.perks).split("·").map((perk) => ({ icon: "✅", title: perk.trim(), body: "" }))),
      button("See My Perks →", url("/dashboard/loyalty")),
      signature(t),
    ].join(""),
  }),

  "loyalty-points-expiring": defineTemplate({
    name: "Points expiring", category: "loyalty",
    subject: () => "Your Points Expire Soon",
    preheader: (d) => `${d.points} points expire on ${d.expiry_date}.`,
    sample: { first_name: "Aline", points: 400, expiry_date: "30 Sep 2026", value_rwf: 4000 },
    html: (d, t) => [
      badge("⏳ Expiring", "warning"),
      greeting(t, d.first_name),
      p(`<strong>${esc(d.points)} points</strong> (worth ${fmtRWF(d.value_rwf)}) will expire on <strong>${esc(d.expiry_date)}</strong>.`),
      p("Use them at checkout on your next booking — they apply automatically when you toggle “Use points”."),
      button("Book & Redeem →", url("/browse")),
      signature(t),
    ].join(""),
  }),

  "referral-invite-sent": defineTemplate({
    name: "Referral invite", category: "loyalty",
    subject: (d) => `${d.referrer_name} Invited You to LORA 🎁`,
    preheader: () => "Premium cars, zero booking fees, and RWF 10,000 off your first trip.",
    sample: { referrer_name: "Aline", referral_url: url("/register?ref=LORA-ALINE"), reward_rwf: 10000 },
    html: (d, t) => [
      badge("🎁 You're invited", "gold"),
      h1(`${esc(d.referrer_name)} thinks you'll love LORA`, { center: true }),
      p("LORA is Rwanda's premium private car booking platform — verified owners, pay at pickup, and <strong>no booking fee</strong>.", { center: true }),
      alert(`🎉 Sign up with this invite and get <strong>${fmtRWF(d.reward_rwf)} off</strong> your first completed trip.`, "gold"),
      button("Claim My Invite →", d.referral_url),
      signature(t),
    ].join(""),
  }),

  "referral-reward-earned": defineTemplate({
    name: "Referral reward", category: "loyalty",
    subject: () => "You Earned a Referral Reward! 🎉",
    preheader: (d) => `${d.friend_name} completed their first trip.`,
    sample: { first_name: "Aline", friend_name: "Eric", reward_rwf: 10000, total_referrals: 3 },
    html: (d, t) => [
      badge("🎉 Reward earned", "success"),
      h1(`${esc(d.friend_name)} took their first trip!`, { center: true }),
      p(`Thanks for spreading the word, ${esc(d.first_name)}. Your reward is ready.`, { center: true }),
      infoCard("", [["Reward", fmtRWF(d.reward_rwf), { strong: true, color: "#10B981" }], ["Friend", esc(d.friend_name)], ["Total referrals", String(d.total_referrals)]]),
      p("Rewards are applied as credit on your next booking.", { muted: true, small: true }),
      button("Invite More Friends →", url("/dashboard/referrals")),
      signature(t),
    ].join(""),
  }),
};
