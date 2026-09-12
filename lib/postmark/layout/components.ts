import { c, font, theme } from "./styles";
import { EMAIL } from "../config";
import type { Tx } from "../i18n";

// ─── Helpers ──────────────────────────────────────────────────────────────────
export const esc = (v: unknown): string =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const fmtRWF = (n: number | string) =>
  `${new Intl.NumberFormat("en-RW", { maximumFractionDigits: 0 }).format(Number(n))} RWF`;

const base = `font-family:${font};`;

// ─── Typography ───────────────────────────────────────────────────────────────
export const h1 = (text: string, opts: { center?: boolean } = {}) =>
  `<h1 class="h1 dm-text" style="${base}font-size:26px;font-weight:700;color:${c.navy};margin:0 0 16px;line-height:1.3;${opts.center ? "text-align:center;" : ""}">${text}</h1>`;

export const h2 = (text: string) =>
  `<h2 class="dm-text" style="${base}font-size:18px;font-weight:700;color:${c.navy};margin:28px 0 12px;">${text}</h2>`;

export const p = (text: string, opts: { muted?: boolean; center?: boolean; small?: boolean; margin?: string } = {}) =>
  `<p class="${opts.muted ? "dm-muted" : "dm-text"}" style="${base}font-size:${opts.small ? 14 : 16}px;line-height:1.6;color:${opts.muted ? c.textMuted : c.text};margin:${opts.margin ?? "0 0 20px"};${opts.center ? "text-align:center;" : ""}">${text}</p>`;

export const greeting = (t: Tx, name?: string) => h1(`${t.hi}${name ? ` ${esc(name)}` : ""} 👋`);

export const signature = (t: Tx, travel = false) =>
  `<p class="dm-text" style="${base}font-size:15px;line-height:1.6;color:${c.text};margin:32px 0 0;">${travel ? t.signoffTravel : t.signoff}<br/><strong>${t.team}</strong> 🇷🇼🚗</p>`;

export const link = (text: string, href: string) =>
  `<a href="${esc(href)}" style="color:${c.navy};font-weight:600;text-decoration:underline;" class="dm-text">${text}</a>`;

export const questions = (t: Tx) =>
  p(`${t.questions} ${link(EMAIL.phoneDisplay, EMAIL.whatsappUrl)}.`, { margin: "24px 0 0" });

// ─── Button ───────────────────────────────────────────────────────────────────
type BtnVariant = "gold" | "navy" | "red" | "green" | "outline";
const btnColors: Record<BtnVariant, { bg: string; fg: string; border?: string }> = {
  gold: { bg: c.gold, fg: c.navy },
  navy: { bg: c.navy, fg: c.gold },
  red: { bg: c.error, fg: c.white },
  green: { bg: c.success, fg: c.white },
  outline: { bg: c.white, fg: c.navy, border: `2px solid ${c.navy}` },
};

export const button = (text: string, href: string, variant: BtnVariant = "gold") => {
  const v = btnColors[variant];
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:28px auto;">
  <tr><td align="center" bgcolor="${v.bg}" style="border-radius:${theme.radius.md};${v.border ? `border:${v.border};` : ""}">
    <a href="${esc(href)}" target="_blank" class="btn" style="display:inline-block;padding:16px 40px;${base}font-size:16px;font-weight:700;color:${v.fg};text-decoration:none;border-radius:${theme.radius.md};letter-spacing:0.3px;">${text}</a>
  </td></tr></table>`;
};

// ─── OTP block (signature element) ────────────────────────────────────────────
export const otpBlock = (code: string, expiresIn: string, t: Tx) =>
  `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:32px auto 0;">
  <tr><td align="center" class="otp-box" bgcolor="${c.gold}" style="background:${c.gold};background-image:linear-gradient(135deg,${c.gold} 0%,${c.goldDark} 100%);border-radius:${theme.radius.lg};padding:28px 56px;box-shadow:0 8px 24px rgba(212,175,55,0.35);">
    <div class="otp-code" style="font-family:${theme.fonts.code};font-size:48px;font-weight:900;letter-spacing:14px;color:${c.navy};line-height:1;text-indent:14px;" aria-label="Verification code ${esc(code).split("").join(" ")}">${esc(code)}</div>
  </td></tr></table>
  <p class="dm-muted" style="text-align:center;${base}font-size:14px;color:${c.textMuted};margin:16px 0 32px;">⏱ ${t.expiresIn} <strong style="color:${c.navy};" class="dm-text">${esc(expiresIn)}</strong></p>`;

export const securityNote = (t: Tx) => alert(`🔒 <strong>${t.neverShare}</strong> ${t.neverShareBody}`, "warning");

export const deviceCard = (t: Tx, d: { ip_location?: unknown; browser?: unknown; device?: unknown; timestamp?: unknown }) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dm-inner" style="background:${c.silverLight};border-radius:${theme.radius.md};margin:24px 0;">
  <tr><td style="padding:16px 20px;${base}font-size:13px;color:${c.textMuted};line-height:1.7;" class="dm-muted">
    <strong style="color:${c.navy};" class="dm-text">${t.requestedFrom}</strong><br/>
    🌍 ${esc(d.ip_location ?? "Unknown location")} · 💻 ${esc(d.browser ?? "Unknown browser")} on ${esc(d.device ?? "unknown device")}<br/>
    🕒 ${esc(d.timestamp ?? "")} (CAT)
  </td></tr></table>`;

// ─── Cards ────────────────────────────────────────────────────────────────────
export type Row = [label: string, value: string, opts?: { strong?: boolean; color?: string }];

export const rows = (list: Row[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${list
    .map(
      ([l, v, o]) =>
        `<tr><td style="${base}font-size:14px;color:${c.textMuted};padding:8px 0;vertical-align:top;" class="dm-muted">${l}</td><td align="right" style="${base}font-size:14px;font-weight:${o?.strong ? 700 : 600};color:${o?.color ?? c.text};padding:8px 0;" class="dm-text">${v}</td></tr>`
    )
    .join("")}</table>`;

export const infoCard = (title: string, list: Row[], footer?: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dm-inner" style="background:${c.silverLight};border:1px solid ${c.border};border-radius:${theme.radius.md};margin:24px 0;">
  <tr><td style="padding:24px;">
    ${title ? `<div style="${base}font-size:18px;font-weight:700;color:${c.navy};margin-bottom:12px;" class="dm-text">${title}</div>` : ""}
    ${rows(list)}
    ${footer ?? ""}
  </td></tr></table>`;

export const totalRow = (label: string, amountRWF: number | string, note?: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
  <tr><td style="border-top:1px solid ${c.border};padding-top:14px;${base}font-size:14px;color:${c.textMuted};" class="dm-muted dm-divider">${label}</td>
      <td align="right" style="border-top:1px solid ${c.border};padding-top:14px;${base}font-size:20px;font-weight:700;color:${c.navy};" class="dm-text dm-divider">${fmtRWF(amountRWF)}</td></tr>
  ${note ? `<tr><td colspan="2" align="right" style="${base}font-size:12px;color:${c.success};padding-top:4px;">${note}</td></tr>` : ""}
  </table>`;

export const carImage = (src: unknown, alt: unknown) =>
  src
    ? `<img src="${esc(src)}" alt="${esc(alt)}" width="536" style="display:block;width:100%;max-width:536px;height:auto;border-radius:${theme.radius.md};margin:0 auto 24px;" />`
    : "";

// ─── Badges & alerts ──────────────────────────────────────────────────────────
type Tone = "success" | "warning" | "error" | "info" | "gold" | "navy";
const tone: Record<Tone, { bg: string; fg: string; light: string }> = {
  success: { bg: c.success, fg: c.white, light: c.successBg },
  warning: { bg: c.warning, fg: c.white, light: c.warningBg },
  error: { bg: c.error, fg: c.white, light: c.errorBg },
  info: { bg: c.info, fg: c.white, light: c.infoBg },
  gold: { bg: c.gold, fg: c.navy, light: c.goldLight },
  navy: { bg: c.navy, fg: c.gold, light: c.silverLight },
};

export const badge = (text: string, kind: Tone = "success") =>
  `<div style="text-align:center;margin:0 0 24px;"><span style="display:inline-block;padding:8px 20px;border-radius:${theme.radius.pill};background:${tone[kind].bg};color:${tone[kind].fg};${base}font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${text}</span></div>`;

export const alert = (message: string, kind: Tone = "info") =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${tone[kind].light};border-left:4px solid ${tone[kind].bg};border-radius:${theme.radius.sm};margin:20px 0;">
  <tr><td style="padding:16px 20px;${base}font-size:14px;line-height:1.6;color:${c.text};">${message}</td></tr></table>`;

export const payAtPickup = (t: Tx) => alert(`💵 <strong>${t.payAtPickup}</strong><br/>${t.accepted}`, "success");

export const banner = (title: string, subtitle: string, kind: Tone = "error") =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${tone[kind].bg};border-radius:${theme.radius.md};margin:0 0 24px;">
  <tr><td align="center" style="padding:20px;">
    <div style="${base}font-size:20px;font-weight:900;color:${tone[kind].fg};letter-spacing:1px;">${title}</div>
    <div style="${base}font-size:13px;color:${tone[kind].fg};opacity:0.85;margin-top:6px;">${subtitle}</div>
  </td></tr></table>`;

// ─── Timeline ─────────────────────────────────────────────────────────────────
export const timeline = (steps: readonly string[], doneThrough: number) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:32px 0;"><tr>${steps
    .map((s, i) => {
      const done = i <= doneThrough;
      return `<td align="center" width="${Math.floor(100 / steps.length)}%" style="vertical-align:top;">
        <div style="width:28px;height:28px;border-radius:50%;background:${done ? c.success : c.border};color:${done ? c.white : c.textFaint};font-weight:700;line-height:28px;${base}font-size:14px;margin:0 auto;text-align:center;">${done ? "✓" : i + 1}</div>
        <div style="${base}font-size:11px;color:${done ? c.navy : c.textFaint};font-weight:600;margin-top:8px;" class="${done ? "dm-text" : ""}">${s}</div>
      </td>`;
    })
    .join("")}</tr></table>`;

// ─── Stats grid ───────────────────────────────────────────────────────────────
export const stats = (items: { label: string; value: string; color?: string }[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;"><tr>${items
    .map(
      (s) => `<td class="stat" width="${Math.floor(100 / items.length)}%" style="padding:4px;vertical-align:top;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dm-inner" style="background:${c.silverLight};border:1px solid ${c.border};border-radius:${theme.radius.md};"><tr><td align="center" style="padding:18px 8px;">
        <div style="${base}font-size:22px;font-weight:800;color:${s.color ?? c.navy};" class="dm-text">${s.value}</div>
        <div style="${base}font-size:11px;color:${c.textMuted};text-transform:uppercase;letter-spacing:0.5px;margin-top:4px;" class="dm-muted">${s.label}</div>
      </td></tr></table></td>`
    )
    .join("")}</tr></table>`;

// ─── Misc ─────────────────────────────────────────────────────────────────────
export const divider = () =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="dm-divider" style="border-top:1px solid ${c.border};padding:16px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr></table>`;

export const quote = (text: string, by?: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;"><tr><td style="border-left:4px solid ${c.gold};padding:12px 20px;${base}font-size:15px;font-style:italic;line-height:1.6;color:${c.text};" class="dm-text">“${text}”${by ? `<br/><span style="font-style:normal;font-size:13px;color:${c.textMuted};">— ${by}</span>` : ""}</td></tr></table>`;

export const stars = (n: number) => `<span style="color:${c.gold};font-size:18px;letter-spacing:2px;">${"★".repeat(Math.max(0, Math.min(5, Math.round(n))))}${"☆".repeat(5 - Math.max(0, Math.min(5, Math.round(n))))}</span>`;

export const qrImage = (payload: string) =>
  `<div style="text-align:center;margin:24px 0;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&color=0A1F44&data=${encodeURIComponent(payload)}" alt="Pickup QR code" width="220" height="220" style="display:block;margin:0 auto;border-radius:${theme.radius.md};border:1px solid ${c.border};" /></div>`;

export const bullets = (items: string[]) =>
  `<ul style="${base}font-size:15px;line-height:1.8;color:${c.text};margin:0 0 20px;padding-left:22px;" class="dm-text">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;

export const featureGrid = (items: { icon: string; title: string; body: string }[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">${items
    .map(
      (f) => `<tr><td style="padding:10px 0;vertical-align:top;width:40px;font-size:24px;">${f.icon}</td>
      <td style="padding:10px 0 10px 8px;"><div style="${base}font-size:15px;font-weight:700;color:${c.navy};" class="dm-text">${f.title}</div><div style="${base}font-size:14px;color:${c.textMuted};line-height:1.5;" class="dm-muted">${f.body}</div></td></tr>`
    )
    .join("")}</table>`;
