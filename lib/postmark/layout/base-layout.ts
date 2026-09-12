import { c, font, headStyles, theme } from "./styles";
import { header } from "./header";
import { footer } from "./footer";
import { esc } from "./components";
import { tx, type EmailLocale } from "../i18n";

export interface LayoutInput {
  subject: string;
  preheader?: string;
  body: string;
  locale?: EmailLocale;
  unsubscribeUrl?: string;
}

export function baseLayout({ subject, preheader, body, locale = "en", unsubscribeUrl }: LayoutInput): string {
  const t = tx(locale);
  return `<!DOCTYPE html>
<html lang="${locale}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${esc(subject)}</title>
  <!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" /><!--<![endif]-->
  <style>${headStyles}</style>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body class="dm-body" style="margin:0;padding:0;background:${c.silverLight};font-family:${font};">
  ${preheader ? `<div style="display:none;font-size:1px;color:${c.silverLight};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${esc(preheader)}${"&nbsp;&zwnj;".repeat(40)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="dm-body" style="background:${c.silverLight};">
    <tr><td align="center" style="padding:32px 16px;">
      <!--[if mso]><table role="presentation" width="${theme.maxWidth}" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
      <table role="presentation" class="container dm-card" width="${theme.maxWidth}" cellpadding="0" cellspacing="0" border="0" style="max-width:${theme.maxWidth}px;width:100%;background:${c.white};border-radius:${theme.radius.lg};overflow:hidden;box-shadow:0 4px 24px rgba(10,31,68,0.08);">
        ${header(t)}
        <tr><td class="pad dm-card" style="padding:40px 32px;background:${c.white};">
          ${body}
        </td></tr>
        ${footer(t, { unsubscribeUrl })}
      </table>
      <!--[if mso]></td></tr></table><![endif]-->
    </td></tr>
  </table>
</body>
</html>`;
}
