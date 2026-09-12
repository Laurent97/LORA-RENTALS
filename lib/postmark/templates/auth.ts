import { defineTemplate } from "../types";
import { url } from "../config";
import {
  alert, badge, bullets, button, deviceCard, esc, featureGrid, greeting, h1, infoCard, otpBlock, p,
  securityNote, signature,
} from "../layout/components";

const device = { ip_location: "Kigali, Rwanda", browser: "Chrome 128", device: "Android", timestamp: "12 Sep 2026, 14:32" };

// Shared OTP body — every OTP email is the gold code block + security note + device card.
const otpBody = (opts: { intro: string; code: string; expires: string; extra?: string; name?: string }) =>
  (t: Parameters<typeof greeting>[0], d: typeof device) =>
    [
      greeting(t, opts.name),
      p(opts.intro),
      otpBlock(opts.code, opts.expires, t),
      opts.extra ?? "",
      securityNote(t),
      d.ip_location || d.browser || d.timestamp ? deviceCard(t, d) : "",
      p(t.didntRequest, { muted: true, small: true, margin: "24px 0 0" }),
      signature(t),
    ].join("");

export const auth = {
  "auth-otp-signup": defineTemplate({
    name: "OTP — Signup", category: "auth",
    subject: (d) => `Your LORA Signup Code: ${d.code}`,
    preheader: () => "Your verification code expires in 10 minutes.",
    sample: { first_name: "Aline", code: "482913", ...device },
    html: (d, t) => otpBody({
      name: d.first_name, code: d.code, expires: "10 minutes",
      intro: `Welcome to <strong>LORA RENTALS</strong> — Rwanda's premium private car booking platform. Use the code below to verify your email and continue your signup.`,
    })(t, d),
  }),

  "auth-otp-login": defineTemplate({
    name: "OTP — Login", category: "auth",
    subject: (d) => `Your LORA Login Code: ${d.code}`,
    preheader: () => "Use this code to sign in. Expires in 10 minutes.",
    sample: { first_name: "Aline", code: "715204", new_device: true, ...device },
    html: (d, t) => otpBody({
      name: d.first_name, code: d.code, expires: "10 minutes",
      intro: "Here's your one-time code to sign in to your LORA account.",
      extra: d.new_device ? alert(`🆕 <strong>New device detected.</strong> If this wasn't you, don't enter the code and <a href="${url("/dashboard/profile")}" style="color:#0A1F44;font-weight:600;">secure your account</a>.`, "info") : "",
    })(t, d),
  }),

  "auth-otp-password-reset": defineTemplate({
    name: "OTP — Password reset", category: "auth",
    subject: (d) => `Reset Your LORA Password — Code: ${d.code}`,
    preheader: () => "Use this code to set a new password. Expires in 10 minutes.",
    sample: { first_name: "Aline", code: "906318", ...device },
    html: (d, t) => otpBody({
      name: d.first_name, code: d.code, expires: "10 minutes",
      intro: "We received a request to reset your password. Enter the code below to choose a new one.",
      extra: alert("If you didn't ask to reset your password, your account is still safe — no changes were made.", "warning"),
    })(t, d),
  }),

  "auth-otp-email-change-old": defineTemplate({
    name: "OTP — Confirm email change (old address)", category: "auth",
    subject: (d) => `Confirm Email Change — Code: ${d.code}`,
    preheader: () => "Confirm that you want to change your LORA email address.",
    sample: { first_name: "Aline", code: "334871", old_email: "aline@example.com", new_email: "aline.new@example.com", ...device },
    html: (d, t) => otpBody({
      name: d.first_name, code: d.code, expires: "15 minutes",
      intro: `You asked to change the email on your LORA account from <strong>${esc(d.old_email)}</strong> to <strong>${esc(d.new_email)}</strong>. Confirm with the code below.`,
    })(t, d),
  }),

  "auth-otp-email-change-new": defineTemplate({
    name: "OTP — Verify new email", category: "auth",
    subject: (d) => `Verify New Email — Code: ${d.code}`,
    preheader: () => "Verify your new LORA email address.",
    sample: { first_name: "Aline", code: "552190", new_email: "aline.new@example.com", ...device },
    html: (d, t) => otpBody({
      name: d.first_name, code: d.code, expires: "15 minutes",
      intro: `Almost done — verify <strong>${esc(d.new_email)}</strong> as your new LORA email with the code below.`,
    })(t, d),
  }),

  "auth-otp-phone-verify": defineTemplate({
    name: "OTP — Phone verification", category: "auth",
    subject: (d) => `Verify Your Phone — Code: ${d.code}`,
    preheader: () => "Verify your phone number for pickup coordination.",
    sample: { first_name: "Aline", code: "118462", phone: "+250 78X XXX XXX", ...device },
    html: (d, t) => otpBody({
      name: d.first_name, code: d.code, expires: "10 minutes",
      intro: `Enter this code to verify <strong>${esc(d.phone)}</strong>. Owners use your verified number to coordinate pickup.`,
    })(t, d),
  }),

  "auth-otp-resend": defineTemplate({
    name: "OTP — Resent code", category: "auth",
    subject: (d) => `Your New LORA Code: ${d.code}`,
    preheader: () => "You requested a new code. Previous codes no longer work.",
    sample: { first_name: "Aline", code: "770254", ...device },
    html: (d, t) => otpBody({
      name: d.first_name, code: d.code, expires: "10 minutes",
      intro: "You requested a new code. Your previous code has been cancelled — use this one instead.",
    })(t, d),
  }),

  "auth-otp-locked": defineTemplate({
    name: "OTP — Too many attempts", category: "auth",
    subject: () => "Too Many Attempts — Account Temporarily Locked",
    preheader: () => "We paused sign-in attempts to protect your account.",
    sample: { first_name: "Aline", unlock_minutes: 30, ...device },
    html: (d, t) => [
      badge("🔒 Account locked", "error"),
      greeting(t, d.first_name),
      p(`We noticed too many incorrect code attempts, so we've temporarily locked sign-in to protect your account.`),
      alert(`⏱ You can try again in <strong>${esc(d.unlock_minutes)} minutes</strong>. No action is needed from you.`, "warning"),
      deviceCard(t, d),
      p(`If this wasn't you, please contact support right away so we can secure your account.`, { small: true }),
      button(t.contactSupport, url("/contact"), "navy"),
      signature(t),
    ].join(""),
  }),

  "auth-otp-expired": defineTemplate({
    name: "OTP — Code expired", category: "auth",
    subject: () => "Your LORA Code Expired",
    preheader: () => "Request a new code to continue.",
    sample: { first_name: "Aline", resend_url: url("/login") },
    html: (d, t) => [
      greeting(t, d.first_name),
      p("The verification code you requested has expired. For your security, codes only last 10 minutes."),
      alert("ℹ️ Request a fresh code and enter it right away.", "info"),
      button("Request New Code →", d.resend_url),
      signature(t),
    ].join(""),
  }),

  "auth-welcome-success": defineTemplate({
    name: "Welcome", category: "auth",
    subject: () => "Welcome to LORA Rentals! 🎉",
    preheader: () => "Premium cars, verified owners, zero booking fees.",
    sample: { first_name: "Aline" },
    html: (d, t) => [
      badge("🎉 Welcome aboard", "gold"),
      h1(`You're in, ${esc(d.first_name)}!`, { center: true }),
      p("Your LORA account is verified. You now have access to Rwanda's finest private cars — from verified owners, with <strong>no booking fee, ever</strong>.", { center: true }),
      featureGrid([
        { icon: "🚗", title: "Browse premium cars", body: "SUVs, 4x4s, sedans and luxury — across Kigali and every province." },
        { icon: "💵", title: "Pay at pickup", body: "Cash, MTN MoMo or card at the office. RWF 0 booking fee." },
        { icon: "📱", title: "QR pickup", body: "Show your QR code, get the keys. No paperwork." },
        { icon: "⭐", title: "Earn LORA Points", body: "Every trip earns points toward discounts and tier perks." },
      ]),
      button(t.browseCars, url("/browse")),
      signature(t),
    ].join(""),
  }),

  "auth-verify-reminder": defineTemplate({
    name: "Verify email reminder", category: "auth",
    subject: () => "Reminder: Verify Your Email",
    preheader: () => "One quick step to unlock bookings.",
    sample: { first_name: "Aline", verify_url: url("/login") },
    html: (d, t) => [
      greeting(t, d.first_name),
      p("You're one step away from booking. Verify your email to activate your LORA account."),
      button("Verify My Email →", d.verify_url),
      p("The link sends you a fresh 6-digit code.", { muted: true, small: true, center: true }),
      signature(t),
    ].join(""),
  }),

  "auth-login-alert": defineTemplate({
    name: "New sign-in alert", category: "auth",
    subject: () => "New Sign-In to Your LORA Account",
    preheader: () => "Was this you? Review the sign-in details.",
    sample: { first_name: "Aline", ...device },
    html: (d, t) => [
      badge("🔔 Security notice", "info"),
      greeting(t, d.first_name),
      p("Your LORA account was just accessed from a new device or location."),
      deviceCard(t, d),
      p("If this was you, no action is needed."),
      alert(`⚠️ <strong>Wasn't you?</strong> <a href="${url("/dashboard/profile")}" style="color:#0A1F44;font-weight:600;">Change your password</a> immediately and contact support.`, "warning"),
      signature(t),
    ].join(""),
  }),

  "auth-password-changed": defineTemplate({
    name: "Password changed", category: "auth",
    subject: () => "Your LORA Password Was Changed",
    preheader: () => "Confirmation of your password change.",
    sample: { first_name: "Aline", ...device },
    html: (d, t) => [
      badge("✅ Password updated", "success"),
      greeting(t, d.first_name),
      p(`Your password was changed on <strong>${esc(d.timestamp)}</strong>.`),
      deviceCard(t, d),
      alert(`If you did not make this change, <a href="${url("/contact")}" style="color:#0A1F44;font-weight:600;">contact support immediately</a>.`, "error"),
      signature(t),
    ].join(""),
  }),

  "auth-email-changed": defineTemplate({
    name: "Email changed", category: "auth",
    subject: () => "Your Email Was Updated",
    preheader: () => "Your LORA account email has changed.",
    sample: { first_name: "Aline", old_email: "aline@example.com", new_email: "aline.new@example.com", timestamp: device.timestamp },
    html: (d, t) => [
      badge("✅ Email updated", "success"),
      greeting(t, d.first_name),
      p("The email address on your LORA account has been changed."),
      infoCard("", [["Previous", esc(d.old_email)], ["New", esc(d.new_email), { strong: true }], ["When", esc(d.timestamp)]]),
      alert("Didn't do this? Reply to this email from your old address and we'll lock the account.", "warning"),
      signature(t),
    ].join(""),
  }),

  "auth-account-locked": defineTemplate({
    name: "Account locked (admin)", category: "auth",
    subject: () => "Your LORA Account Was Temporarily Locked",
    preheader: () => "Here's why and how to restore access.",
    sample: { first_name: "Aline", reason: "Unusual sign-in activity" },
    html: (d, t) => [
      badge("🔒 Account locked", "error"),
      greeting(t, d.first_name),
      p("To protect you, we've temporarily locked your LORA account."),
      infoCard("", [["Reason", esc(d.reason)]]),
      p("To restore access, contact our support team. We'll verify your identity and unlock the account."),
      button(t.contactSupport, url("/contact"), "navy"),
      signature(t),
    ].join(""),
  }),

  "auth-kyc-approved": defineTemplate({
    name: "KYC approved", category: "auth",
    subject: () => "Your KYC Is Verified ✅",
    preheader: () => "You're a verified LORA member. Owners: list your first car.",
    sample: { first_name: "Jean", is_owner: true },
    html: (d, t) => [
      badge("✅ Verified", "success"),
      h1(`Congratulations, ${esc(d.first_name)}!`, { center: true }),
      p("Your identity documents have been reviewed and approved. You now carry the <strong>Verified</strong> badge across LORA.", { center: true }),
      d.is_owner
        ? bullets(["Your listings display the blue verified check", "Customers see your response time and rating", "You're eligible for airport-approved status"])
        : bullets(["Faster pickups — owners trust verified renters", "Eligible for corporate and long-term rentals"]),
      button(d.is_owner ? "List Your First Car →" : t.browseCars, url(d.is_owner ? "/owner/fleet" : "/browse")),
      signature(t),
    ].join(""),
  }),

  "auth-kyc-rejected": defineTemplate({
    name: "KYC needs update", category: "auth",
    subject: () => "Action Required: KYC Update",
    preheader: () => "We couldn't verify your documents. Here's what to fix.",
    sample: { first_name: "Jean", reason: "ID photo is blurry — please upload a clear, well-lit image." },
    html: (d, t) => [
      badge("⚠️ Action required", "warning"),
      greeting(t, d.first_name),
      p("We reviewed your verification documents but couldn't approve them yet."),
      alert(`<strong>Reason:</strong> ${esc(d.reason)}`, "warning"),
      p("Please resubmit — most re-reviews complete within 24 hours."),
      button("Resubmit Documents →", url("/dashboard/profile")),
      signature(t),
    ].join(""),
  }),
};
