-- LORA long-term lease marketplace (T2P8)

create table if not exists public.long_term_leases (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  customer_id uuid references public.users(id),
  owner_id uuid not null references public.users(id),
  start_date date not null,
  end_date date not null,
  monthly_price int not null, -- RWF
  maintenance_included boolean not null default true,
  swap_allowed boolean not null default true,
  auto_renewal boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft','pending','active','paused','cancelled','completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_long_term_leases_vehicle on public.long_term_leases(vehicle_id, status);
create index if not exists idx_long_term_leases_customer on public.long_term_leases(customer_id, status);
create index if not exists idx_long_term_leases_status on public.long_term_leases(status, created_at desc);

alter table public.long_term_leases enable row level security;

drop policy if exists "long_term_leases_public_read" on public.long_term_leases;
drop policy if exists "long_term_leases_owner_write" on public.long_term_leases;

create policy "long_term_leases_public_read" on public.long_term_leases for select using (status in ('draft','pending','active','paused','completed'));
create policy "long_term_leases_owner_write" on public.long_term_leases for all
  using (
    public.is_admin() or
    exists (select 1 from public.vehicles v where v.id = vehicle_id and v.owner_id = auth.uid()) or
    (customer_id = auth.uid() and status in ('pending','active','paused'))
  );
