-- LORA Corporate & Fleet Management 2.0 policies (T2P7)

create table if not exists public.corporate_policies (
  account_id uuid primary key references public.corporate_accounts(id) on delete cascade,
  max_daily_rate int,
  require_approval boolean not null default false,
  approver_emails text[] not null default '{}',
  cost_centers text[] not null default '{}',
  bulk_booking_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.corporate_booking_approvals (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  account_id uuid not null references public.corporate_accounts(id),
  requested_by uuid not null references public.users(id),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approver_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_corporate_approvals_booking on public.corporate_booking_approvals(booking_id);
create index if not exists idx_corporate_approvals_account on public.corporate_booking_approvals(account_id, status);

alter table public.corporate_policies enable row level security;
alter table public.corporate_booking_approvals enable row level security;

drop policy if exists "corporate_policies_admin" on public.corporate_policies;
drop policy if exists "corporate_approvals_members" on public.corporate_booking_approvals;

create policy "corporate_policies_admin" on public.corporate_policies for all using (public.is_admin());
create policy "corporate_approvals_members" on public.corporate_booking_approvals for all
  using (
    public.is_admin() or
    exists (select 1 from public.corporate_members m where m.user_id = auth.uid())
  );
