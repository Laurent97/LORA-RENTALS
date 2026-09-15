// Shared LORA-branded HTML document shell for receipts, invoices, and confirmations.

import { BRAND } from "@/lib/constants";

export const DOCUMENT_COLORS = {
  navy: "#0A1F44",
  gold: "#D4AF37",
  silver: "#C0C6CC",
  white: "#ffffff",
  dark: "#1f2937",
  muted: "#6b7280",
  light: "#f3f4f6",
  success: "#10b981",
  warning: "#f59e0b",
  destructive: "#ef4444",
} as const;

export type DocStatus = "paid" | "unpaid" | "cancelled" | "confirmed" | "pending" | "overdue" | "completed";

const STATUS_STYLES: Record<DocStatus, { color: string; bg: string; stamp: string }> = {
  paid: { color: DOCUMENT_COLORS.success, bg: "#ecfdf5", stamp: "PAID" },
  unpaid: { color: DOCUMENT_COLORS.warning, bg: "#fffbeb", stamp: "UNPAID" },
  cancelled: { color: DOCUMENT_COLORS.destructive, bg: "#fef2f2", stamp: "CANCELLED" },
  confirmed: { color: DOCUMENT_COLORS.navy, bg: "#eff6ff", stamp: "CONFIRMED" },
  pending: { color: DOCUMENT_COLORS.warning, bg: "#fffbeb", stamp: "PENDING" },
  overdue: { color: DOCUMENT_COLORS.destructive, bg: "#fef2f2", stamp: "OVERDUE" },
  completed: { color: DOCUMENT_COLORS.success, bg: "#ecfdf5", stamp: "COMPLETED" },
};

export function statusBadge(status: DocStatus): string {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return `<span style="display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${s.color};background:${s.bg};border:1px solid ${s.color}40;">${status}</span>`;
}

export function statusStamp(status: DocStatus): string {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return `
    <div style="position:absolute;top:40px;right:40px;transform:rotate(-12deg);border:4px solid ${s.color};color:${s.color};border-radius:12px;padding:12px 24px;font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:.12em;opacity:.85;background:${s.bg};">
      ${s.stamp}
    </div>`;
}

export function documentShell(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — ${BRAND.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 40px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: ${DOCUMENT_COLORS.light}; color: ${DOCUMENT_COLORS.dark}; line-height: 1.5;
    }
    .page {
      max-width: 800px; margin: 0 auto; background: ${DOCUMENT_COLORS.white};
      border-radius: 16px; box-shadow: 0 10px 40px rgba(10,31,68,0.08); overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, ${DOCUMENT_COLORS.navy} 0%, #122b5c 100%);
      color: ${DOCUMENT_COLORS.white}; padding: 40px 48px; position: relative;
    }
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .logo-mark {
      width: 48px; height: 48px; background: ${DOCUMENT_COLORS.gold}; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; font-weight: 900; color: ${DOCUMENT_COLORS.navy}; font-size: 20px;
    }
    .brand-name { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .brand-tagline { font-size: 12px; color: ${DOCUMENT_COLORS.silver}; margin-top: 2px; }
    .doc-title { font-size: 28px; font-weight: 800; margin: 0; color: ${DOCUMENT_COLORS.gold}; }
    .doc-meta { font-size: 13px; color: ${DOCUMENT_COLORS.silver}; margin-top: 8px; }
    .body { padding: 48px; position: relative; }
    .stamp-wrap { position: relative; }
    .section { margin-bottom: 28px; }
    .section-title {
      font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
      color: ${DOCUMENT_COLORS.gold}; margin-bottom: 12px;
    }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    .detail { margin-bottom: 8px; }
    .detail-label { font-size: 11px; color: ${DOCUMENT_COLORS.muted}; text-transform: uppercase; letter-spacing: .04em; }
    .detail-value { font-size: 14px; font-weight: 600; }
    .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .table th {
      background: ${DOCUMENT_COLORS.navy}; color: ${DOCUMENT_COLORS.white}; text-align: left;
      padding: 14px 16px; font-size: 12px; text-transform: uppercase; letter-spacing: .04em;
    }
    .table td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .table tr:nth-child(even) { background: #f9fafb; }
    .table .right { text-align: right; }
    .totals { margin-top: 20px; margin-left: auto; max-width: 320px; }
    .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .total-row.grand { font-size: 18px; font-weight: 800; color: ${DOCUMENT_COLORS.navy}; border-bottom: 2px solid ${DOCUMENT_COLORS.gold}; padding-top: 14px; }
    .footer {
      background: ${DOCUMENT_COLORS.navy}; color: ${DOCUMENT_COLORS.silver}; padding: 24px 48px;
      font-size: 12px; text-align: center;
    }
    .footer a { color: ${DOCUMENT_COLORS.gold}; text-decoration: none; }
    .note { background: #f9fafb; border-left: 4px solid ${DOCUMENT_COLORS.gold}; padding: 16px; border-radius: 0 12px 12px 0; font-size: 13px; }
    @media print {
      body { background: white; padding: 0; }
      .page { box-shadow: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    ${body}
    <div class="footer">
      ${BRAND.name} · ${BRAND.phone} · ${BRAND.email} · ${BRAND.siteUrl}<br/>
      ${BRAND.address}
    </div>
  </div>
</body>
</html>`;
}
