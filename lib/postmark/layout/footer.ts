import { c, font } from "./styles";
import { EMAIL } from "../config";
import type { Tx } from "../i18n";

const social: { label: string; href: string; glyph: string }[] = [
  { label: "Facebook", href: EMAIL.social.facebook, glyph: "f" },
  { label: "Instagram", href: EMAIL.social.instagram, glyph: "◎" },
  { label: "X", href: EMAIL.social.x, glyph: "𝕏" },
  { label: "LinkedIn", href: EMAIL.social.linkedin, glyph: "in" },
];

export function footer(t: Tx, opts: { unsubscribeUrl?: string; year?: number }): string {
  const year = opts.year ?? new Date().getFullYear();
  const muted = `font-family:${font};font-size:12px;color:${c.textMuted};`;
  return `
  <tr><td style="padding:0 32px;"><div class="dm-divider" style="border-top:1px solid ${c.border};"></div></td></tr>
  <tr><td style="padding:24px 32px;text-align:center;">
    <p class="dm-muted" style="font-family:${font};font-size:14px;color:${c.textMuted};margin:0 0 12px;">${t.needHelp}</p>
    <a href="${EMAIL.whatsappUrl}" class="dm-text" style="font-family:${font};font-size:14px;font-weight:600;color:${c.navy};text-decoration:none;">💬 ${t.whatsapp} ${EMAIL.phoneDisplay}</a>
    <span class="dm-muted" style="${muted}"> · </span>
    <a href="mailto:${EMAIL.supportEmail}" class="dm-text" style="font-family:${font};font-size:14px;font-weight:600;color:${c.navy};text-decoration:none;">✉️ ${EMAIL.supportEmail}</a>
  </td></tr>
  <tr><td class="dm-footer" style="background:${c.silverLight};padding:32px 24px;text-align:center;border-top:1px solid ${c.border};">
    <img src="${EMAIL.assetBase}/icon-gold.png" alt="LORA" width="32" height="32" style="display:block;margin:0 auto 12px;width:32px;height:32px;" />
    <div class="dm-text" style="font-family:${font};font-size:13px;font-weight:700;color:${c.navy};letter-spacing:1px;">${EMAIL.companyName}</div>
    <div class="dm-muted" style="${muted}margin-top:8px;line-height:1.6;">
      ${EMAIL.address}<br/>${EMAIL.tin ? `TIN: ${EMAIL.tin} · ` : ""}${EMAIL.phoneDisplay}
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:20px auto 0;"><tr>
      ${social
        .map(
          (s) =>
            `<td style="padding:0 6px;"><a href="${s.href}" aria-label="${s.label}" style="display:inline-block;width:32px;height:32px;line-height:32px;border-radius:50%;background:${c.navy};color:${c.gold};font-family:${font};font-size:13px;font-weight:700;text-align:center;text-decoration:none;">${s.glyph}</a></td>`
        )
        .join("")}
    </tr></table>
    <div class="dm-muted" style="font-family:${font};font-size:11px;color:${c.textMuted};margin-top:20px;line-height:1.8;">
      ${opts.unsubscribeUrl ? `<a href="${opts.unsubscribeUrl}" style="color:${c.textMuted};text-decoration:underline;">${t.unsubscribe}</a> · ` : ""}
      <a href="${EMAIL.siteUrl}/privacy" style="color:${c.textMuted};text-decoration:underline;">${t.privacy}</a> ·
      <a href="${EMAIL.siteUrl}/terms" style="color:${c.textMuted};text-decoration:underline;">${t.terms}</a>
      <br/><br/>© ${year} ${EMAIL.companyName}. ${t.rights}<br/>${t.madeIn}
    </div>
  </td></tr>`;
}
