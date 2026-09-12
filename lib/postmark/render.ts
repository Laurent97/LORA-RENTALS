import { baseLayout } from "./layout/base-layout";
import { htmlToText, textFrame } from "./layout/text";
import { tx, type EmailLocale } from "./i18n";
import { getTemplate } from "./templates/registry";
import { EMAIL, url } from "./config";
import type { RenderedEmail, TemplateData } from "./types";

// Pure render — no I/O. Used by send.ts, previews, tests.
export function renderEmail(slug: string, data: TemplateData, locale: EmailLocale = "en", opts: { userId?: string } = {}): RenderedEmail {
  const tpl = getTemplate(slug);
  if (!tpl) throw new Error(`Unknown email template: ${slug}`);
  const t = tx(locale);
  const subject = tpl.subject(data);
  const preheader = tpl.preheader(data);
  const body = tpl.html(data, t);
  const stream = tpl.stream ?? "outbound";
  const unsubscribeUrl = stream === "broadcast" ? url(`/unsubscribe?u=${encodeURIComponent(opts.userId ?? "")}`) : undefined;
  const html = baseLayout({ subject, preheader, body, locale, unsubscribeUrl });
  const text = textFrame(tpl.text ? tpl.text(data, t) : htmlToText(body), t);
  return { subject, preheader, html, text, stream: stream === "broadcast" ? EMAIL.broadcastStream as "broadcast" : "outbound" };
}
