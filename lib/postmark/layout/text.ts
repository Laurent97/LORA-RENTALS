import { EMAIL } from "../config";
import type { Tx } from "../i18n";

// Converts a body HTML fragment into a readable plain-text alternative.
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, (_, alt) => (alt ? `[${alt}]` : ""))
    .replace(/<img[^>]*>/gi, "")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
      const label = inner.replace(/<[^>]+>/g, "").trim();
      const h = String(href);
      return label && !label.includes(h) && !h.startsWith("mailto:") ? `${label} (${h})` : label || h;
    })
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|tr|table)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/td>\s*<td/gi, ": <td")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&zwnj;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function textFrame(body: string, t: Tx): string {
  return `${body}

—
${t.needHelp}
${t.whatsapp}: ${EMAIL.phoneDisplay} (${EMAIL.whatsappUrl})
${t.email}: ${EMAIL.supportEmail}

${EMAIL.companyName} · ${EMAIL.address}
${EMAIL.siteUrl}`;
}
