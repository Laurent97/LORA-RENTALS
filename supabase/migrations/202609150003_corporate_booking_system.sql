-- Feature B — Corporate Booking System

-- Upgrade existing corporate tables from seed.sql
alter table public.corporate_accounts add column if not exists legal_name text;
alter table public.corporate_accounts add column if not exists registration_number text;
alter table public.corporate_accounts add column if not exists industry text;
alter table public.corporate_accounts add column if not exists website text;
alter table public.corporate_accounts add column if not exists logo_url text;
alter table public.corporate_accounts add column if not exists billing_address text;
alter table public.corporate_accounts add column if not exists billing_phone text;
alter table public.corporate_accounts add column if not exists billing_city text;
alter table public.corporate_accounts add column if not exists credit_limit_rwf numeric default 0;
alter table public.corporate_accounts add column if not exists current_balance_rwf numeric default 0;
alter table public.corporate_accounts add column if not exists discount_percent numeric(5,2) default 0;
alter table public.corporate_accounts add column if not exists custom_rate_card jsonb default '{}'::jsonb;
alter table public.corporate_accounts add column if not exists account_manager_id uuid references public.users(id);
alter table public.corporate_accounts add column if not exists dedicated_support_email text;
alter table public.corporate_accounts add column if not exists approved_by uuid references public.users(id);
alter table public.corporate_accounts add column if not exists approved_at timestamptz;
alter table public.corporate_accounts add column if not exists updated_at timestamptz not null default now();

-- Add corporate_id to members table and backfill from account_id
alter table public.corporate_members add column if not exists corporate_id uuid references public.corporate_accounts(id);
update public.corporate_members set corporate_id = account_id where corporate_id is null and account_id is not null;

alter table public.corporate_members add column if not exists cost_center_id uuid references public.cost_centers(id);
alter table public.corporate_members add column if not exists can_book boolean not null default true;
alter table public.corporate_members add column if not exists can_approve boolean not null default false;
alter table public.corporate_members add column if not exists monthly_limit_rwf numeric;
alter table public.corporate_members add column if not exists invited_by uuid references public.users(id);
alter table public.corporate_members add column if not exists invited_at timestamptz;
alter table public.corporate_members add column if not exists joined_at timestamptz;
alter table public.corporate_members add column if not exists status text not null default 'active' check (status in ('invited','active','suspended','removed'));

create table if not exists public.cost_centers (
  id uuid primary key default uuid_generate_v4(),
  corporate_id uuid not null references public.corporate_accounts(id) on delete cascade,
  name text not null,
  code text,
  monthly_budget_rwf numeric,
  spent_this_month_rwf numeric default 0,
  manager_id uuid references public.users(id),
  is_active boolean default true,
  created_at timestamptz not null default now()
);

create table if not exists public.corporate_booking_policies (
  corporate_id uuid primary key references public.corporate_accounts(id) on delete cascade,
  max_daily_rate_rwf numeric,
  requires_approval boolean default true,
  approval_threshold_rwf numeric,
  allow_self_drive boolean default true,
  allow_with_driver boolean default true,
  allowed_vehicle_types text[] default '{}',
  allowed_locations text[] default '{}',
  require_po_number boolean default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.corporate_invoices (
  id uuid primary key default uuid_generate_v4(),
  corporate_id uuid not null references public.corporate_accounts(id),
  invoice_number text unique not null,
  period_start date not null,
  period_end date not null,
  subtotal_rwf numeric not null,
  discount_rwf numeric default 0,
  vat_rwf numeric default 0,
  total_rwf numeric not null,
  currency text default 'RWF',
  status text default 'draft' check (status in ('draft','sent','paid','overdue','cancelled')),
  due_date date,
  paid_at timestamptz,
  paid_method text,
  payment_reference text,
  pdf_url text,
  line_items jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_corporate_accounts_status on public.corporate_accounts(status);
create index if not exists idx_cost_centers_corporate on public.cost_centers(corporate_id);
create index if not exists idx_corporate_members_user on public.corporate_members(user_id);
create index if not exists idx_corporate_invoices_corporate on public.corporate_invoices(corporate_id, period_end desc);

alter table public.corporate_accounts enable row level security;
alter table public.cost_centers enable row level security;
alter table public.corporate_members enable row level security;
alter table public.corporate_booking_policies enable row level security;
alter table public.corporate_invoices enable row level security;

drop policy if exists "corporate_accounts_members" on public.corporate_accounts;
drop policy if exists "cost_centers_members" on public.cost_centers;
drop policy if exists "corporate_members_view" on public.corporate_members;
drop policy if exists "corporate_booking_policies_members" on public.corporate_booking_policies;
drop policy if exists "corporate_invoices_admins" on public.corporate_invoices;

create policy "corporate_accounts_members" on public.corporate_accounts for all
  using (public.is_admin() or id in (select corporate_id from public.corporate_members where user_id = auth.uid()));
create policy "cost_centers_members" on public.cost_centers for all
  using (public.is_admin() or corporate_id in (select corporate_id from public.corporate_members where user_id = auth.uid()));
create policy "corporate_members_view" on public.corporate_members for all
  using (public.is_admin() or corporate_id in (select corporate_id from public.corporate_members m where m.user_id = auth.uid()));
create policy "corporate_booking_policies_members" on public.corporate_booking_policies for all
  using (public.is_admin() or corporate_id in (select corporate_id from public.corporate_members where user_id = auth.uid()));
create policy "corporate_invoices_admins" on public.corporate_invoices for all
  using (public.is_admin() or corporate_id in (select corporate_id from public.corporate_members where user_id = auth.uid() and role = 'admin'));

alter table public.bookings add column if not exists corporate_id uuid references public.corporate_accounts(id);
alter table public.bookings add column if not exists cost_center_id uuid references public.cost_centers(id);
alter table public.bookings add column if not exists booked_by_user_id uuid references public.users(id);
alter table public.bookings add column if not exists po_number text;
alter table public.bookings add column if not exists approval_status text default 'not_required'
  check (approval_status in ('not_required','pending','approved','rejected'));
alter table public.bookings add column if not exists approved_by uuid references public.users(id);
alter table public.bookings add column if not exists approved_at timestamptz;
alter table public.bookings add column if not exists payment_type text default 'on_pickup'
  check (payment_type in ('on_pickup','invoice'));
