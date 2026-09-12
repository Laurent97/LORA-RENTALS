-- LORA USSD payments: additive and safe to run after the original seed schema.
alter table public.payments drop constraint if exists payments_method_check;
alter table public.payments add constraint payments_method_check check (method in ('cash','momo','card','ussd','manual','office','pickup'));
alter table public.payments add column if not exists user_id uuid references public.users(id);
alter table public.payments add column if not exists amount_rwf int;
alter table public.payments add column if not exists amount_usd numeric;
alter table public.payments add column if not exists provider text;
alter table public.payments add column if not exists phone text;
alter table public.payments add column if not exists ussd_code text;
alter table public.payments add column if not exists status text not null default 'pending';
alter table public.payments add column if not exists transaction_id text;
alter table public.payments add column if not exists provider_reference text;
alter table public.payments add column if not exists confirmed_by uuid references public.users(id);
alter table public.payments add column if not exists confirmed_at timestamptz;
alter table public.payments add column if not exists failure_reason text;
alter table public.payments add column if not exists metadata jsonb;
alter table public.payments add column if not exists updated_at timestamptz not null default now();
alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check check (status in ('pending','awaiting_confirmation','completed','failed','refunded','cancelled'));
alter table public.payments drop constraint if exists payments_provider_check;
alter table public.payments add constraint payments_provider_check check (provider is null or provider in ('mtn','airtel','ekash','cash','card','bank'));

create index if not exists idx_payments_booking on public.payments(booking_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_payments_created on public.payments(created_at);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'payments') then
    alter publication supabase_realtime add table public.payments;
  end if;
end $$;

create table if not exists public.payment_events (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  event_type text not null,
  payload jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.payment_events enable row level security;
drop policy if exists "payment_events_read" on public.payment_events;
create policy "payment_events_read" on public.payment_events for select using (
  public.is_admin() or exists (select 1 from public.payments p join public.bookings b on b.id = p.booking_id where p.id = payment_id and (b.customer_id = auth.uid() or b.owner_id = auth.uid()))
);

-- Only server-side service-role routes write events and payment rows.
drop policy if exists "payments_customer_insert" on public.payments;