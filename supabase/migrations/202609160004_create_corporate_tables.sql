-- Create missing corporate base tables if they do not exist yet.
-- Also fixes RLS recursion that caused 500 Internal Server Errors on
-- /rest/v1/invoices, /rest/v1/corporate_accounts and /rest/v1/corporate_members.

create table if not exists public.corporate_accounts (
  id uuid primary key default uuid_generate_v4(),
  company_name text not null,
  tin text,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  credit_terms text not null default 'net15' check (credit_terms in ('prepaid','net15','net30')),
  status text not null default 'pending' check (status in ('pending','approved','suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.corporate_members (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.corporate_accounts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin','member')),
  cost_center text,
  unique (account_id, user_id)
);

create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid not null references public.corporate_accounts(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount int not null,
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue')),
  created_at timestamptz not null default now()
);

-- Add the corporate_id column used by the newer corporate booking system and backfill it.
alter table public.corporate_members add column if not exists corporate_id uuid references public.corporate_accounts(id);
update public.corporate_members set corporate_id = account_id where corporate_id is null and account_id is not null;

-- Ensure corporate_id mirrors account_id on writes so RLS predicates work on insert.
create or replace function public.set_corporate_member_corporate_id() returns trigger
language plpgsql
as $$
begin
  if new.corporate_id is null then
    new.corporate_id := new.account_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_corporate_member_corporate_id on public.corporate_members;
create trigger trg_set_corporate_member_corporate_id
  before insert or update on public.corporate_members
  for each row execute function public.set_corporate_member_corporate_id();

-- Helper functions that bypass RLS so corporate policies do not recursively query themselves.
create or replace function public.get_user_corporate_ids() returns setof uuid
language sql stable security definer
as $$
  select coalesce(corporate_id, account_id) from public.corporate_members where user_id = auth.uid();
$$;

create or replace function public.get_user_admin_corporate_ids() returns setof uuid
language sql stable security definer
as $$
  select coalesce(corporate_id, account_id) from public.corporate_members where user_id = auth.uid() and role = 'admin';
$$;

grant execute on function public.get_user_corporate_ids() to authenticated, anon;
grant execute on function public.get_user_admin_corporate_ids() to authenticated, anon;

-- Enable RLS.
alter table public.corporate_accounts enable row level security;
alter table public.corporate_members enable row level security;
alter table public.invoices enable row level security;

-- Drop all old/duplicate/broken policies so we can recreate them cleanly.
drop policy if exists "corp_read" on public.corporate_accounts;
drop policy if exists "corp_insert" on public.corporate_accounts;
drop policy if exists "corp_admin_update" on public.corporate_accounts;
drop policy if exists "corporate_accounts_members" on public.corporate_accounts;
drop policy if exists "corporate_accounts_insert" on public.corporate_accounts;
drop policy if exists "corporate_accounts_read" on public.corporate_accounts;
drop policy if exists "corporate_accounts_admin" on public.corporate_accounts;
drop policy if exists "corporate_accounts_update" on public.corporate_accounts;
drop policy if exists "corporate_accounts_delete" on public.corporate_accounts;

drop policy if exists "corp_members_read" on public.corporate_members;
drop policy if exists "corp_members_admin" on public.corporate_members;
drop policy if exists "corporate_members_view" on public.corporate_members;
drop policy if exists "corporate_members_insert" on public.corporate_members;
drop policy if exists "corporate_members_read" on public.corporate_members;
drop policy if exists "corporate_members_update" on public.corporate_members;
drop policy if exists "corporate_members_delete" on public.corporate_members;

drop policy if exists "invoices_read" on public.invoices;
drop policy if exists "invoices_admin" on public.invoices;

-- Recreate non-recursive policies.
create policy "corporate_accounts_insert" on public.corporate_accounts
  for insert with check (true);

create policy "corporate_accounts_read" on public.corporate_accounts
  for select using (public.is_admin() or id in (select public.get_user_corporate_ids()));

create policy "corporate_accounts_update" on public.corporate_accounts
  for update using (public.is_admin());

create policy "corporate_accounts_delete" on public.corporate_accounts
  for delete using (public.is_admin());

create policy "corporate_members_insert" on public.corporate_members
  for insert with check (
    public.is_admin()
    or user_id = auth.uid()
    or corporate_id in (select public.get_user_corporate_ids())
  );

create policy "corporate_members_read" on public.corporate_members
  for select using (public.is_admin() or corporate_id in (select public.get_user_corporate_ids()));

create policy "corporate_members_update" on public.corporate_members
  for update using (
    public.is_admin()
    or (user_id = auth.uid() and corporate_id in (select public.get_user_corporate_ids()))
  );

create policy "corporate_members_delete" on public.corporate_members
  for delete using (public.is_admin());

create policy "invoices_read" on public.invoices
  for select using (public.is_admin() or account_id in (select public.get_user_corporate_ids()));

create policy "invoices_admin" on public.invoices
  for all using (public.is_admin());

-- Fix the newer corporate tables if they were already created by migration 202609150003.
do $$
begin
  if to_regclass('public.cost_centers') is not null then
    alter table public.cost_centers enable row level security;
    drop policy if exists "cost_centers_members" on public.cost_centers;
    create policy "cost_centers_members" on public.cost_centers for all
      using (public.is_admin() or corporate_id in (select public.get_user_corporate_ids()));
  end if;

  if to_regclass('public.corporate_booking_policies') is not null then
    alter table public.corporate_booking_policies enable row level security;
    drop policy if exists "corporate_booking_policies_members" on public.corporate_booking_policies;
    create policy "corporate_booking_policies_members" on public.corporate_booking_policies for all
      using (public.is_admin() or corporate_id in (select public.get_user_corporate_ids()));
  end if;

  if to_regclass('public.corporate_invoices') is not null then
    alter table public.corporate_invoices enable row level security;
    drop policy if exists "corporate_invoices_admins" on public.corporate_invoices;
    create policy "corporate_invoices_admins" on public.corporate_invoices for all
      using (public.is_admin() or corporate_id in (select public.get_user_admin_corporate_ids()));
  end if;
end $$;
