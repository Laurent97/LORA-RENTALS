import { BRAND } from "@/lib/constants";
import { documentShell, statusBadge, statusStamp, type DocStatus } from "./template";

export interface ReceiptData {
  receiptNo: string;
  issuedAt: string;
  status: DocStatus;
  bookingId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  ownerName: string;
  vehicle: { make: string; model: string; year: number; plate: string; type: string };
  startDate: string;
  endDate: string;
  pickupLocation: string;
  returnLocation: string;
  paymentMethod: string;
  subtotal: number;
  discount?: number;
  vat?: number;
  total: number;
}

export function renderReceipt(r: ReceiptData): string {
  const fmt = (n: number) => `RWF ${n.toLocaleString("en-RW")}`;
  const body = `
    <div class="safety">
      <div class="safety-title">🛡️ LORA Safety Notice</div>
      <p>
        This receipt confirms payment received at the LORA office or at pickup only. ${BRAND.name} does not charge any booking fee. We are not responsible for any payment made outside our official channels, including WhatsApp, Mobile Money, bank transfer, or third-party links.
      </p>
    </div>
    <div class="header">
      <div class="header-row">
        <div class="brand">
          <div class="logo-mark">L</div>
          <div>
            <div class="brand-name">${BRAND.shortName}</div>
            <div class="brand-tagline">${BRAND.tagline}</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="doc-title">RECEIPT</div>
          <div class="doc-meta">${r.receiptNo}</div>
          <div class="doc-meta">Issued ${new Date(r.issuedAt).toLocaleDateString("en-GB")}</div>
          ${statusBadge(r.status)}
        </div>
      </div>
    </div>
    <div class="body stamp-wrap">
      ${statusStamp(r.status)}
      <div class="section">
        <div class="section-title">Customer</div>
        <div class="detail"><div class="detail-label">Name</div><div class="detail-value">${r.customerName}</div></div>
        <div class="detail"><div class="detail-label">Email</div><div class="detail-value">${r.customerEmail ?? "—"}</div></div>
        <div class="detail"><div class="detail-label">Phone</div><div class="detail-value">${r.customerPhone ?? "—"}</div></div>
      </div>
      <div class="grid">
        <div class="section">
          <div class="section-title">Vehicle</div>
          <div class="detail"><div class="detail-value">${r.vehicle.year} ${r.vehicle.make} ${r.vehicle.model} — ${r.vehicle.type.toUpperCase()}</div></div>
          <div class="detail"><div class="detail-label">Plate</div><div class="detail-value">${r.vehicle.plate}</div></div>
          <div class="detail"><div class="detail-label">Owner</div><div class="detail-value">${r.ownerName}</div></div>
        </div>
        <div class="section">
          <div class="section-title">Trip</div>
          <div class="detail"><div class="detail-label">Pickup</div><div class="detail-value">${r.startDate}</div></div>
          <div class="detail"><div class="detail-label">Return</div><div class="detail-value">${r.endDate}</div></div>
          <div class="detail"><div class="detail-label">Locations</div><div class="detail-value">${r.pickupLocation} → ${r.returnLocation}</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Payment</div>
        <table class="table">
          <thead><tr><th>Description</th><th class="right">Amount</th></tr></thead>
          <tbody>
            <tr><td>Vehicle rental</td><td class="right">${fmt(r.subtotal)}</td></tr>
            ${r.discount ? `<tr><td>Discount</td><td class="right" style="color:#10b981;">−${fmt(r.discount)}</td></tr>` : ""}
            ${r.vat ? `<tr><td>VAT (18%)</td><td class="right">${fmt(r.vat)}</td></tr>` : ""}
          </tbody>
        </table>
        <div class="totals">
          <div class="total-row"><span>Subtotal</span><span>${fmt(r.subtotal)}</span></div>
          ${r.discount ? `<div class="total-row"><span>Discount</span><span>−${fmt(r.discount)}</span></div>` : ""}
          ${r.vat ? `<div class="total-row"><span>VAT</span><span>${fmt(r.vat)}</span></div>` : ""}
          <div class="total-row grand"><span>Total paid</span><span>${fmt(r.total)}</span></div>
        </div>
        <div style="margin-top:16px;text-align:center;font-size:13px;color:#6b7280;">
          Paid via <strong>${r.paymentMethod}</strong> · Booking ${r.bookingId}
        </div>
      </div>
      <div class="note">
        This receipt confirms payment has been received by ${BRAND.name}. For support contact ${BRAND.supportEmail}.
      </div>
    </div>`;
  return documentShell(body, `Receipt ${r.receiptNo}`);
}
