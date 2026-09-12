# LORA Mobile Money Payments

The customer payment route is `/dashboard/bookings/{bookingId}/pay`. It supports Rwanda phone detection for MTN MoMo (`078`, `079`), Airtel Money (`072`, `073`), and eKash fallback. On a phone it opens a `tel:` USSD link; on desktop it provides the exact code and clipboard fallback.

## Supabase setup

1. Apply `supabase/migrations/202609120001_ussd_payments.sql` after `supabase/seed.sql`.
2. Enable the `payments` table in the `supabase_realtime` publication in the Supabase dashboard.
3. Set `SUPABASE_SERVICE_ROLE_KEY` for the server routes and keep it out of client code.
4. Set `PAYMENT_WEBHOOK_SECRET` and configure the chosen aggregator to call `/api/payments/webhook` with `x-payment-webhook-secret`.

The initiation route validates ownership, caps the amount at the booking total, and limits active attempts to three per booking in fifteen minutes. A customer confirmation only requests review; an authenticated admin or verified provider webhook completes the payment and updates `bookings.payment_confirmed`.

## Aggregator integration

The browser USSD flow is the default and requires no gateway account. For server-side push, add the provider request inside `/api/payments/initiate` after the pending row is created, save its reference to `provider_reference`, and pass the payment id as the provider callback reference. Never accept, log, or proxy a customer PIN.