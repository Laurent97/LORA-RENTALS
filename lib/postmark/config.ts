import { BRAND } from "@/lib/constants";

// Central email config. Env overrides allowed; brand constants are the source of truth.
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? BRAND.siteUrl).replace(/\/$/, "");

export const EMAIL = {
  siteUrl,
  assetBase: (process.env.EMAIL_ASSET_BASE ?? `${siteUrl}/email`).replace(/\/$/, ""),
  fromEmail: process.env.POSTMARK_FROM_EMAIL ?? `noreply@${BRAND.domain}`,
  fromName: process.env.POSTMARK_FROM_NAME ?? "LORA RENTALS",
  replyTo: process.env.POSTMARK_REPLY_TO ?? BRAND.supportEmail,
  stream: process.env.POSTMARK_MESSAGE_STREAM ?? "outbound",
  broadcastStream: process.env.POSTMARK_BROADCAST_STREAM ?? "broadcast",
  supportEmail: BRAND.supportEmail,
  phoneDisplay: BRAND.phone,
  phoneE164: `+${BRAND.whatsapp}`,
  whatsappUrl: `https://wa.me/${BRAND.whatsapp}`,
  address: BRAND.address,
  companyName: BRAND.name,
  tin: process.env.LORA_TIN ?? "",
  social: {
    facebook: "https://facebook.com/lorarentals",
    instagram: "https://instagram.com/lorarentals",
    x: "https://x.com/lorarentals",
    linkedin: "https://linkedin.com/company/lorarentals",
  },
} as const;

export const url = (path: string) => `${EMAIL.siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
