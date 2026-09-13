-- LORA EV fleet program (BonusP19)

create table if not exists public.ev_vehicles (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  battery_capacity_kwh numeric(5,2),
  range_km int,
  charge_type text[] not null default '{}',
  green_rebate_pct int default 0,
  co2_saved_kg numeric(8,2) default 0,
  energy_cost_per_km int, -- RWF
  created_at timestamptz not null default now()
);

create table if not exists public.charging_stations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  location text not null,
  lat double precision,
  lng double precision,
  connector_types text[] not null default '{}',
  power_kw numeric(6,2),
  available boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_charging_stations_location on public.charging_stations(location);

alter table public.ev_vehicles enable row level security;
alter table public.charging_stations enable row level security;

drop policy if exists "ev_vehicles_public" on public.ev_vehicles;
drop policy if exists "charging_stations_public" on public.charging_stations;

create policy "ev_vehicles_public" on public.ev_vehicles for select using (true);
create policy "charging_stations_public" on public.charging_stations for select using (true);
