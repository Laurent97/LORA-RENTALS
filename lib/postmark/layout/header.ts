import { c, font } from "./styles";
import { EMAIL } from "../config";
import type { Tx } from "../i18n";

// Navy header: gold shield icon (image) + HTML wordmark. The wordmark is live
// text so the brand still reads correctly when images are blocked.
export function header(t: Tx): string {
  return `<tr><td style="background:${c.navy};padding:32px 24px;text-align:center;">
    <a href="${EMAIL.siteUrl}" style="text-decoration:none;">
      <img src="${EMAIL.assetBase}/icon-gold.png" srcset="${EMAIL.assetBase}/icon-gold@2x.png 2x" alt="" width="48" height="48" style="display:block;margin:0 auto 12px;border:0;width:48px;height:48px;" />
      <div style="font-family:${font};font-size:22px;font-weight:900;letter-spacing:4px;color:${c.white};line-height:1;" role="heading" aria-level="1">LORA <span style="color:${c.gold};">RENTALS</span> <span style="font-weight:400;color:${c.silver};font-size:14px;letter-spacing:3px;">LTD</span></div>
    </a>
    <div style="font-family:${font};font-size:11px;letter-spacing:2px;color:${c.gold};text-transform:uppercase;margin-top:12px;font-weight:600;">${t.tagline}</div>
  </td></tr>
  <tr><td style="height:4px;background:${c.gold};background-image:linear-gradient(90deg,${c.gold},${c.goldDark},${c.gold});font-size:0;line-height:0;">&nbsp;</td></tr>`;
}
