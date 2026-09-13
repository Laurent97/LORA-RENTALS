-- LORA insurance & roadside assistance bundles (T2P10)

create table if not exists public.insurance_addons (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  tier text not null check (tier in ('basic','standard','premium')),
  daily_price int not null, -- RWF
  liability_cap int not null, -- RWF
  deductible int not null, -- RWF
  coverage text[] not null default '{}',
  status text not null default 'available' check (status in ('available','unavailable')),
  created_at timestamptz not null default now()
);

create table if not exists public.roadside_plans (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  provider_name text not null,
  daily_price int not null default 0, -- RWF
  services text[] not null default '{}',
  response_minutes int,
  status text not null default 'available' check (status in ('available','unavailable')),
  created_at timestamptz not null default now()
);

create index if not exists idx_insurance_addons_vehicle on public.insurance_addons(vehicle_id, status);
create index if not exists idx_roadside_plans_vehicle on public.roadside_plans(vehicle_id, status);

alter table public.insurance_addons enable row level security;
alter table public.roadside_plans enable row level security;

drop policy if exists "insurance_addons_public_read" on public.insurance_addons;
drop policy if exists "insurance_addons_owner_write" on public.insurance_addons;
drop policy if exists "roadside_plans_public_read" on public.roadside_plans;
drop policy if exists "roadside_plans_owner_write" on public.roadside_plans;

create policy "insurance_addons_public_read" on public.insurance_addons for select using (status = 'available');
create policy "insurance_addons_owner_write" on public.insurance_addons for all
  using (public.is_admin() or exists (select 1 from public.vehicles v where v.id = vehicle_id and v.owner_id = auth.uid()));
create policy "roadside_plans_public_read" on public.roadside_plans for select using (status = 'available');
create policy "roadside_plans_owner_write" on public.roadside_plans for all
  using (public.is_admin() or exists (select 1 from public.vehicles v where v.id = vehicle_id and v.owner_id = auth.uid()));
