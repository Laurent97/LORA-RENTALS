-- Independent driver marketplace schema

-- allow driver role in public.users
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('customer','owner','driver','admin','corporate_admin','corporate_manager','corporate_member'));

-- Extend public.drivers for independent drivers
alter table public.drivers add column if not exists user_id uuid references public.users(id);
alter table public.drivers add column if not exists driver_type text default 'owner_attached'
  check (driver_type in ('owner_attached','independent'));
alter table public.drivers add column if not exists is_independent boolean default false;

alter table public.drivers add column if not exists daily_rate_rwf numeric;
alter table public.drivers add column if not exists hourly_rate_rwf numeric;
alter table public.drivers add column if not exists half_day_rate_rwf numeric;
alter table public.drivers add column if not exists airport_pickup_rate_rwf numeric;
alter table public.drivers add column if not exists min_hours int default 4;
alter table public.drivers add column if not exists service_radius_km int default 50;
alter table public.drivers add column if not exists home_city text;
alter table public.drivers add column if not exists serves_cities text[] default '{}'::text[];
alter table public.drivers add column if not exists max_passengers int default 5;
alter table public.drivers add column if not exists accepts_long_distance boolean default true;
alter table public.drivers add column if not exists accepts_airport_pickup boolean default true;
alter table public.drivers add column if not exists accepts_night_driving boolean default true;
alter table public.drivers add column if not exists accepts_outside_kigali boolean default true;

alter table public.drivers add column if not exists available_from time default '06:00';
alter table public.drivers add column if not exists available_until time default '22:00';
alter table public.drivers add column if not exists unavailable_dates jsonb default '[]'::jsonb;

alter table public.drivers add column if not exists total_trips int default 0;
alter table public.drivers add column if not exists total_earnings_rwf numeric default 0;
alter table public.drivers add column if not exists outstanding_balance_rwf numeric default 0;

alter table public.drivers add column if not exists kyc_status text default 'pending'
  check (kyc_status in ('pending','submitted','approved','rejected'));
alter table public.drivers add column if not exists approved_by uuid references public.users(id);
alter table public.drivers add column if not exists approved_at timestamptz;

alter table public.drivers add column if not exists district text;
alter table public.drivers add column if not exists nationality text;
alter table public.drivers add column if not exists gender text;
alter table public.drivers add column if not exists date_of_birth date;
alter table public.drivers add column if not exists vehicle_types text[] default '{}'::text[];
alter table public.drivers add column if not exists whatsapp text;
alter table public.drivers add column if not exists passport_photo_url text;
alter table public.drivers add column if not exists license_photo_url text;
alter table public.drivers add column if not exists national_id_url text;
alter table public.drivers add column if not exists criminal_record_url text;

-- Driver marketplace junction table
create table if not exists public.driver_bookings (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  driver_id uuid references public.drivers(id),
  customer_id uuid references public.users(id),
  owner_id uuid references public.users(id),
  service_type text check (service_type in (
    'full_day','half_day','hourly','airport_pickup','tour','long_distance'
  )),
  start_at timestamptz not null,
  end_at timestamptz,
  pickup_location text,
  dropoff_location text,
  passengers int,
  rate_rwf numeric not null,
  hours int,
  days int,
  subtotal_rwf numeric not null,
  platform_commission_rwf numeric,
  driver_net_rwf numeric,
  deposit_rwf numeric,
  status text default 'pending'
    check (status in (
      'pending','accepted','declined','confirmed',
      'in_progress','completed','cancelled','no_show'
    )),
  contact_revealed_at timestamptz,
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid references public.users(id),
  cancellation_reason text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.driver_availability (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers(id) on delete cascade,
  date date not null,
  is_available boolean default true,
  available_from time,
  available_until time,
  reason text,
  created_at timestamptz default now(),
  unique (driver_id, date)
);

create table if not exists public.driver_earnings (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers(id) on delete cascade,
  driver_booking_id uuid references public.driver_bookings(id),
  amount_rwf numeric not null,
  type text check (type in ('trip','bonus','tip','penalty')),
  status text default 'pending'
    check (status in ('pending','available','paid','withdrawn')),
  paid_at timestamptz,
  paid_method text,
  paid_reference text,
  created_at timestamptz default now()
);

create index if not exists idx_drivers_independent on public.drivers(is_independent) where is_independent = true;
create index if not exists idx_drivers_user on public.drivers(user_id);
create index if not exists idx_drivers_available on public.drivers(is_available, is_verified);
create index if not exists idx_driver_bookings_booking on public.driver_bookings(booking_id);
create index if not exists idx_driver_bookings_driver on public.driver_bookings(driver_id);
create index if not exists idx_driver_bookings_status on public.driver_bookings(status);
create index if not exists idx_driver_earnings_driver on public.driver_earnings(driver_id, status);
