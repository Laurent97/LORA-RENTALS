-- Feature A — Driver-Included Vehicles

create table if not exists public.drivers (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users(id) on delete cascade,
  full_name text not null,
  phone text,
  whatsapp text,
  email text,
  date_of_birth date,
  gender text check (gender in ('male','female','other')),
  nationality text,
  city text,
  languages text[] not null default '{}',
  photo_url text,
  passport_photo_url text,
  license_number text,
  license_photo_url text,
  license_expiry date,
  national_id_url text,
  background_check_status text not null default 'pending' check (background_check_status in ('pending','approved','rejected')),
  years_of_experience int not null default 0,
  bio text,
  specialties text[] not null default '{}',
  rating_avg numeric(3,2) default 0,
  rating_count int default 0,
  is_available boolean not null default true,
  is_verified boolean not null default false,
  verified_at timestamptz,
  verified_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.driver_reviews (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  booking_id uuid references public.bookings(id),
  customer_id uuid references public.users(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  tags text[] not null default '{}',
  status text not null default 'published' check (status in ('published','hidden','removed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_drivers_owner on public.drivers(owner_id);
create index if not exists idx_drivers_available on public.drivers(is_available) where is_available = true;
create index if not exists idx_driver_reviews_driver on public.driver_reviews(driver_id, status);

alter table public.drivers enable row level security;
alter table public.driver_reviews enable row level security;

drop policy if exists "drivers_public" on public.drivers;
drop policy if exists "drivers_owner_write" on public.drivers;
drop policy if exists "driver_reviews_public" on public.driver_reviews;

create policy "drivers_public" on public.drivers for select using (is_verified = true and is_available = true);
create policy "drivers_owner_write" on public.drivers for all
  using (owner_id = auth.uid() or public.is_admin());
create policy "driver_reviews_public" on public.driver_reviews for select using (status = 'published');

alter table public.vehicles add column if not exists rental_mode text not null default 'self_drive'
  check (rental_mode in ('self_drive','with_driver','both'));
alter table public.vehicles add column if not exists driver_id uuid references public.drivers(id);
alter table public.vehicles add column if not exists price_self_drive_rwf int default 0;
alter table public.vehicles add column if not exists price_with_driver_rwf int default 0;
alter table public.vehicles add column if not exists driver_included_daily_fee int default 0;
