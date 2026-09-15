import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { renderInvoice } from "@/lib/documents/invoice";
import type { DocStatus } from "@/lib/documents/template";
import { BRAND } from "@/lib/constants";

export async function GET(_: Request, { params }: { params: { invoiceId: string } }) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  const { data: invoice } = await sb.from("corporate_invoices").select("*, corporate_accounts(*)").eq("id", params.invoiceId).single();
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const corp = (invoice.corporate_accounts ?? {}) as any;
  const items = Array.isArray(invoice.line_items) ? invoice.line_items : [];

  const html = renderInvoice({
    invoiceNo: invoice.invoice_number ?? `LORA-INV-${String(invoice.id).slice(0, 8).toUpperCase()}`,
    issuedAt: invoice.created_at,
    dueDate: invoice.due_date,
    status: (invoice.status === "paid" ? "paid" : invoice.status === "overdue" ? "overdue" : "unpaid") as DocStatus,
    billedTo: {
      companyName: corp.company_name ?? "Customer",
      tin: corp.tin,
      address: corp.billing_address,
      email: corp.billing_email ?? corp.contact_email ?? "",
    },
    billedBy: {
      name: BRAND.name,
      address: BRAND.address,
      email: BRAND.financeEmail,
      phone: BRAND.phone,
    },
    periodStart: invoice.period_start,
    periodEnd: invoice.period_end,
    lineItems: items.map((it: any) => ({
      description: it.description ?? "Rental",
      quantity: it.quantity ?? 1,
      unitPrice: it.unit_price ?? 0,
      total: it.total ?? it.amount ?? 0,
    })),
    subtotal: Number(invoice.subtotal_rwf ?? 0),
    discount: invoice.discount_rwf ? Number(invoice.discount_rwf) : undefined,
    vat: invoice.vat_rwf ? Number(invoice.vat_rwf) : undefined,
    total: Number(invoice.total_rwf ?? 0),
    currency: invoice.currency ?? "RWF",
    paymentInstructions: `Bank transfer or MoMo to ${BRAND.name}. Reference: ${invoice.invoice_number}.`,
  });

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
