-- Feature A — Driver-Included Vehicles
-- This migration upgrades the existing public.drivers table from the chauffeur
-- marketplace and adds the review/driver-included vehicle columns.

-- Add owner_id derived from the existing user_id column
alter table public.drivers add column if not exists owner_id uuid references public.users(id);
update public.drivers set owner_id = user_id where owner_id is null and user_id is not null;

-- Add full driver profile columns if not already present
alter table public.drivers add column if not exists full_name text not null default '';
alter table public.drivers add column if not exists photo_url text;
alter table public.drivers add column if not exists passport_photo_url text;
alter table public.drivers add column if not exists license_number text;
alter table public.drivers add column if not exists license_photo_url text;
alter table public.drivers add column if not exists license_expiry date;
alter table public.drivers add column if not exists national_id_url text;
alter table public.drivers add column if not exists background_check_status text not null default 'pending' check (background_check_status in ('pending','approved','rejected'));
alter table public.drivers add column if not exists years_of_experience int not null default 0;
alter table public.drivers add column if not exists specialties text[] not null default '{}';
alter table public.drivers add column if not exists rating_avg numeric(3,2) default 0;
alter table public.drivers add column if not exists rating_count int default 0;
alter table public.drivers add column if not exists is_available boolean not null default true;
alter table public.drivers add column if not exists is_verified boolean not null default false;
alter table public.drivers add column if not exists verified_at timestamptz;
alter table public.drivers add column if not exists verified_by uuid references public.users(id);
alter table public.drivers add column if not exists updated_at timestamptz not null default now();

-- Backfill from existing columns where possible
update public.drivers set is_verified = license_verified where is_verified = false and license_verified = true;
update public.drivers set rating_avg = rating where rating_avg = 0 and rating is not null;
update public.drivers set rating_count = review_count where rating_count = 0 and review_count is not null;

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
