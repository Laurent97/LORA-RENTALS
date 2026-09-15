import { BRAND } from "@/lib/constants";
import { documentShell, statusBadge, statusStamp, type DocStatus } from "./template";

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  invoiceNo: string;
  issuedAt: string;
  dueDate: string;
  status: DocStatus;
  billedTo: { companyName: string; tin?: string; address?: string; email: string };
  billedBy: { name: string; address: string; email: string; phone: string };
  periodStart: string;
  periodEnd: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discount?: number;
  vat?: number;
  total: number;
  currency?: string;
  paymentInstructions?: string;
}

export function renderInvoice(i: InvoiceData): string {
  const currency = i.currency ?? "RWF";
  const fmt = (n: number) => `${currency} ${n.toLocaleString("en-RW")}`;
  const body = `
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
          <div class="doc-title">INVOICE</div>
          <div class="doc-meta">${i.invoiceNo}</div>
          <div class="doc-meta">Issued ${new Date(i.issuedAt).toLocaleDateString("en-GB")}</div>
          <div class="doc-meta">Due ${new Date(i.dueDate).toLocaleDateString("en-GB")}</div>
          ${statusBadge(i.status)}
        </div>
      </div>
    </div>
    <div class="body stamp-wrap">
      ${statusStamp(i.status)}
      <div class="grid">
        <div class="section">
          <div class="section-title">Billed to</div>
          <div class="detail"><div class="detail-value">${i.billedTo.companyName}</div></div>
          <div class="detail"><div class="detail-label">TIN</div><div class="detail-value">${i.billedTo.tin ?? "—"}</div></div>
          <div class="detail"><div class="detail-label">Address</div><div class="detail-value">${i.billedTo.address ?? "—"}</div></div>
          <div class="detail"><div class="detail-label">Email</div><div class="detail-value">${i.billedTo.email}</div></div>
        </div>
        <div class="section">
          <div class="section-title">Billed by</div>
          <div class="detail"><div class="detail-value">${i.billedBy.name}</div></div>
          <div class="detail"><div class="detail-label">Address</div><div class="detail-value">${i.billedBy.address}</div></div>
          <div class="detail"><div class="detail-label">Phone</div><div class="detail-value">${i.billedBy.phone}</div></div>
          <div class="detail"><div class="detail-label">Email</div><div class="detail-value">${i.billedBy.email}</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Invoice period</div>
        <div class="detail-value">${new Date(i.periodStart).toLocaleDateString("en-GB")} — ${new Date(i.periodEnd).toLocaleDateString("en-GB")}</div>
      </div>
      <div class="section">
        <div class="section-title">Line items</div>
        <table class="table">
          <thead>
            <tr><th>Description</th><th class="right">Qty</th><th class="right">Unit price</th><th class="right">Total</th></tr>
          </thead>
          <tbody>
            ${i.lineItems.map((li) => `
              <tr>
                <td>${li.description}</td>
                <td class="right">${li.quantity}</td>
                <td class="right">${fmt(li.unitPrice)}</td>
                <td class="right" style="font-weight:600;">${fmt(li.total)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="totals">
          <div class="total-row"><span>Subtotal</span><span>${fmt(i.subtotal)}</span></div>
          ${i.discount ? `<div class="total-row"><span>Discount</span><span>−${fmt(i.discount)}</span></div>` : ""}
          ${i.vat ? `<div class="total-row"><span>VAT (18%)</span><span>${fmt(i.vat)}</span></div>` : ""}
          <div class="total-row grand"><span>Total due</span><span>${fmt(i.total)}</span></div>
        </div>
      </div>
      ${i.paymentInstructions ? `<div class="note"><strong>Payment instructions:</strong> ${i.paymentInstructions}</div>` : ""}
      <div class="note" style="margin-top:16px;">
        Thank you for choosing ${BRAND.name}. Questions? Contact ${BRAND.financeEmail}.
      </div>
    </div>`;
  return documentShell(body, `Invoice ${i.invoiceNo}`);
}
