-- LORA sustainability dashboard (BonusP24)

create table if not exists public.vehicle_emissions (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  co2_g_per_km int,
  fuel_consumption_l_per_100km numeric(4,2),
  offset_program text,
  verified boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.carbon_offsets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  km int not null,
  co2_kg numeric(8,4) not null,
  offset_rwf int not null default 0,
  partner text,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_carbon_offsets_user on public.carbon_offsets(user_id, created_at desc);

alter table public.vehicle_emissions enable row level security;
alter table public.carbon_offsets enable row level security;

drop policy if exists "vehicle_emissions_public" on public.vehicle_emissions;
drop policy if exists "carbon_offsets_own" on public.carbon_offsets;

create policy "vehicle_emissions_public" on public.vehicle_emissions for select using (true);
create policy "carbon_offsets_own" on public.carbon_offsets for all using (user_id = auth.uid() or public.is_admin());
