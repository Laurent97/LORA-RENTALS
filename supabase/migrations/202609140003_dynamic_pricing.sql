-- LORA dynamic pricing engine (T1P3)

create table if not exists public.vehicle_pricing_rules (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  weekend_surcharge_pct int not null default 15,
  long_rental_7_discount_pct int not null default 10,
  long_rental_30_discount_pct int not null default 20,
  last_minute_discount_pct int not null default 5,
  early_bird_discount_pct int not null default 5,
  early_bird_days int not null default 30,
  high_demand_bump_pct int not null default 15,
  high_demand_dates date[] not null default '{}',
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicle_pricing_rules_enabled on public.vehicle_pricing_rules(enabled);

alter table public.vehicle_pricing_rules enable row level security;

drop policy if exists "vehicle_pricing_rules_public_read" on public.vehicle_pricing_rules;
drop policy if exists "vehicle_pricing_rules_owner_write" on public.vehicle_pricing_rules;

create policy "vehicle_pricing_rules_public_read" on public.vehicle_pricing_rules for select using (true);
create policy "vehicle_pricing_rules_owner_write" on public.vehicle_pricing_rules for all
  using (
    public.is_admin() or
    exists (select 1 from public.vehicles v where v.id = vehicle_id and v.owner_id = auth.uid())
  );
