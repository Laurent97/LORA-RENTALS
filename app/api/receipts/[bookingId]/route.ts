import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { renderReceipt } from "@/lib/documents/receipt";
import type { DocStatus } from "@/lib/documents/template";

export async function GET(_: Request, { params }: { params: { bookingId: string } }) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

  const { data: booking } = await sb.from("bookings").select("*, vehicles(*), users!bookings_customer_id_fkey(*), owners:users!bookings_owner_id_fkey(name)").eq("id", params.bookingId).single();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const v = (booking.vehicles ?? {}) as any;
  const customer = (booking.users ?? {}) as any;
  const owner = (booking.owners ?? { name: "" }) as any;

  const html = renderReceipt({
    receiptNo: `LORA-RC-${String(booking.id).slice(0, 8).toUpperCase()}`,
    issuedAt: booking.created_at,
    status: (booking.payment_confirmed ? "paid" : "pending") as DocStatus,
    bookingId: params.bookingId,
    customerName: customer.name ?? "Customer",
    customerEmail: customer.email,
    customerPhone: customer.phone,
    ownerName: owner.name ?? "Owner",
    vehicle: { make: v.make ?? "", model: v.model ?? "", year: v.year ?? 0, plate: v.plate ?? "", type: v.type ?? "" },
    startDate: new Date(booking.start_date).toLocaleDateString("en-GB"),
    endDate: new Date(booking.end_date).toLocaleDateString("en-GB"),
    pickupLocation: booking.pickup_location,
    returnLocation: booking.return_location,
    paymentMethod: booking.payment_method ?? "Cash",
    subtotal: Number(booking.total_price ?? 0),
    total: Number(booking.total_price ?? 0),
  });

  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
