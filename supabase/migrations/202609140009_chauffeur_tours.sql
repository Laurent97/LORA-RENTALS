-- LORA chauffeur & guided tour marketplace (T2P9)

create table if not exists public.drivers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  bio text,
  languages text[] not null default '{}',
  license_verified boolean not null default false,
  rating numeric(2,1) default 0,
  review_count int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.tours (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  title text not null,
  description text,
  price int not null, -- RWF
  duration_hours int not null,
  languages text[] not null default '{}',
  itinerary text[] not null default '{}',
  status text not null default 'available'
    check (status in ('available','unavailable')),
  created_at timestamptz not null default now()
);

create index if not exists idx_drivers_rating on public.drivers(rating desc);
create index if not exists idx_tours_driver on public.tours(driver_id, status);
create index if not exists idx_tours_status on public.tours(status, created_at desc);

alter table public.drivers enable row level security;
alter table public.tours enable row level security;

drop policy if exists "drivers_public_read" on public.drivers;
drop policy if exists "drivers_owner_write" on public.drivers;
drop policy if exists "tours_public_read" on public.tours;
drop policy if exists "tours_owner_write" on public.tours;

create policy "drivers_public_read" on public.drivers for select using (true);
create policy "drivers_owner_write" on public.drivers for all using (user_id = auth.uid() or public.is_admin());
create policy "tours_public_read" on public.tours for select using (status = 'available');
create policy "tours_owner_write" on public.tours for all
  using (
    public.is_admin() or
    exists (select 1 from public.drivers d where d.id = driver_id and d.user_id = auth.uid())
  );
