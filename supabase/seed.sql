-- ─── LORA RENTALS LTD — Supabase schema + seed ──────────────────────────────
-- Run in the Supabase SQL editor. Auth users are created via Supabase Auth;
-- this creates the public profile + domain tables.

create extension if not exists "uuid-ossp";

-- ── Tables ──────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  role text not null check (role in ('customer','owner','admin')) default 'customer',
  name text not null,
  email text unique not null,
  phone text,
  avatar text,
  kyc_status text not null default 'none' check (kyc_status in ('none','pending','verified','rejected')),
  business_name text,
  payout_method text check (payout_method in ('momo','bank')),
  payout_details text,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users(id) on delete cascade,
  make text not null,
  model text not null,
  year int not null,
  plate text not null,
  type text not null check (type in ('sedan','suv','pickup','luxury','minivan','4x4')),
  transmission text not null check (transmission in ('automatic','manual')),
  fuel text not null check (fuel in ('petrol','diesel','hybrid','electric')),
  seats int not null,
  price_per_day int not null, -- RWF
  location text not null,
  district text,
  lat double precision,
  lng double precision,
  images text[] not null default '{}',
  features text[] not null default '{}',
  description text,
  status text not null default 'pending_approval'
    check (status in ('available','unavailable','maintenance','pending_approval')),
  verified boolean not null default false,
  rating numeric(2,1) default 0,
  review_count int default 0,
  trips_completed int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.users(id),
  vehicle_id uuid not null references public.vehicles(id),
  owner_id uuid not null references public.users(id),
  start_date date not null,
  end_date date not null,
  pickup_location text not null,
  return_location text not null,
  extras text[] not null default '{}',
  total_price int not null,          -- RWF, rental + extras only
  booking_fee int not null default 0 check (booking_fee = 0), -- NEVER charge a booking fee
  status text not null default 'requested'
    check (status in ('requested','confirmed','picked_up','returned','completed','cancelled','declined')),
  payment_method text not null check (payment_method in ('cash','momo','card')),
  payment_point text not null check (payment_point in ('office','pickup')),
  payment_confirmed boolean not null default false,
  qr_code text not null,
  driver_name text,
  driver_license text,
  driver_id_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id),
  vehicle_id uuid not null references public.vehicles(id),
  customer_id uuid not null references public.users(id),
  owner_id uuid references public.users(id),
  rating int not null check (rating between 1 and 5),
  title text,
  comment text,
  photos jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  status text not null default 'published'
    check (status in ('published','hidden','flagged','removed')),
  flagged_by uuid[] not null default '{}',
  flag_reason text,
  admin_note text,
  removed_by uuid references public.users(id),
  removed_at timestamptz,
  removal_reason text,
  edited_at timestamptz,
  edit_count int not null default 0,
  is_verified_booking boolean not null default true,
  helpful_count int not null default 0,
  owner_reply text, -- legacy column; replies live in review_replies
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- one review per booking
create unique index if not exists reviews_booking_uidx on public.reviews(booking_id);
create index if not exists reviews_vehicle_idx on public.reviews(vehicle_id);
create index if not exists reviews_customer_idx on public.reviews(customer_id);
create index if not exists reviews_owner_idx on public.reviews(owner_id);
create index if not exists reviews_status_idx on public.reviews(status);

create table if not exists public.review_replies (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  owner_id uuid not null references public.users(id),
  comment text not null,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  unique (review_id) -- one reply per review
);
create index if not exists review_replies_review_idx on public.review_replies(review_id);

create table if not exists public.review_helpful_votes (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

create table if not exists public.review_reports (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  reported_by uuid not null references public.users(id),
  reason text not null,
  details text,
  status text not null default 'pending' check (status in ('pending','reviewed','dismissed','actioned')),
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists review_reports_review_idx on public.review_reports(review_id);
create index if not exists review_reports_status_idx on public.review_reports(status);

create table if not exists public.review_audit_log (
  id uuid primary key default uuid_generate_v4(),
  review_id uuid,
  reply_id uuid,
  action text not null,
  actor_id uuid references public.users(id),
  actor_role text,
  old_value jsonb,
  new_value jsonb,
  reason text,
  ip_address inet,
  created_at timestamptz not null default now()
);
create index if not exists review_audit_review_idx on public.review_audit_log(review_id);

-- migrate legacy owner_reply text into review_replies (idempotent)
insert into public.review_replies (review_id, owner_id, comment)
select r.id, coalesce(r.owner_id, b.owner_id), r.owner_reply
from public.reviews r
join public.bookings b on b.id = r.booking_id
where r.owner_reply is not null and r.owner_reply <> ''
  and not exists (select 1 from public.review_replies rr where rr.review_id = r.id);

-- keep vehicles.rating / review_count in sync with published reviews
create or replace function public.update_vehicle_rating()
returns trigger language plpgsql as $$
declare vid uuid := coalesce(new.vehicle_id, old.vehicle_id);
begin
  update public.vehicles set
    rating = coalesce((select round(avg(rating)::numeric,1) from public.reviews where vehicle_id = vid and status = 'published'), 0),
    review_count = (select count(*) from public.reviews where vehicle_id = vid and status = 'published')
  where id = vid;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_review_rating on public.reviews;
create trigger trg_review_rating
after insert or update or delete on public.reviews
for each row execute function public.update_vehicle_rating();

create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id),
  amount int not null,
  method text not null check (method in ('cash','momo','card')),
  point text not null check (point in ('office','pickup')),
  confirmed_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.disputes (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id),
  raised_by uuid not null references public.users(id),
  description text not null,
  status text not null default 'open' check (status in ('open','investigating','resolved')),
  resolution text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('booking','payment','kyc','system','promo')),
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.kyc_documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('national_id','passport','drivers_license','vehicle_registration','insurance','inspection')),
  url text not null,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  created_at timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.vehicles enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.payments enable row level security;
alter table public.notifications enable row level security;
alter table public.kyc_documents enable row level security;

-- helper: is the current user an admin?
create or replace function public.is_admin() returns boolean language sql stable as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

-- users: public can read profiles (owner names shown on listings); admins read all
drop policy if exists "users_read_own" on public.users;
drop policy if exists "users_read_profiles" on public.users;
drop policy if exists "users_update_own" on public.users;
create policy "users_read_profiles" on public.users for select using (true);
create policy "users_update_own" on public.users for update
  using (id = auth.uid() or public.is_admin());

-- vehicles: everyone reads live listings; owners manage their own; admins all
drop policy if exists "vehicles_public_read" on public.vehicles;
drop policy if exists "vehicles_owner_write" on public.vehicles;
create policy "vehicles_public_read" on public.vehicles for select
  using (status = 'available' or owner_id = auth.uid() or public.is_admin());
create policy "vehicles_owner_write" on public.vehicles for all
  using (owner_id = auth.uid() or public.is_admin());

-- bookings: customers see own; owners see bookings on their vehicles; admins all
drop policy if exists "bookings_read" on public.bookings;
drop policy if exists "bookings_customer_insert" on public.bookings;
drop policy if exists "bookings_update" on public.bookings;
create policy "bookings_read" on public.bookings for select
  using (customer_id = auth.uid() or owner_id = auth.uid() or public.is_admin());
create policy "bookings_customer_insert" on public.bookings for insert
  with check (customer_id = auth.uid());
create policy "bookings_update" on public.bookings for update
  using (customer_id = auth.uid() or owner_id = auth.uid() or public.is_admin());

-- reviews: public reads published only; parties read own; admins read all.
-- Customers create for their own completed bookings and may edit within 7 days
-- (until the owner replies). NO delete policy for customers/owners — only
-- admins can delete, and only via the service-role API route.
drop policy if exists "reviews_read" on public.reviews;
drop policy if exists "reviews_insert" on public.reviews;
drop policy if exists "reviews_public_read" on public.reviews;
drop policy if exists "reviews_parties_read" on public.reviews;
drop policy if exists "reviews_customer_insert" on public.reviews;
drop policy if exists "reviews_customer_update" on public.reviews;
drop policy if exists "reviews_admin_delete" on public.reviews;
drop policy if exists "reviews_admin_update" on public.reviews;
create policy "reviews_public_read" on public.reviews for select
  using (status = 'published');
create policy "reviews_parties_read" on public.reviews for select
  using (customer_id = auth.uid() or owner_id = auth.uid() or public.is_admin());
create policy "reviews_customer_insert" on public.reviews for insert
  with check (
    customer_id = auth.uid()
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.customer_id = auth.uid() and b.status = 'completed'
    )
  );
create policy "reviews_customer_update" on public.reviews for update
  using (
    customer_id = auth.uid()
    and edit_count < 1
    and created_at > now() - interval '7 days'
    and not exists (select 1 from public.review_replies rr where rr.review_id = reviews.id)
  );
create policy "reviews_admin_update" on public.reviews for update using (public.is_admin());
create policy "reviews_admin_delete" on public.reviews for delete using (public.is_admin());

alter table public.review_replies enable row level security;
alter table public.review_helpful_votes enable row level security;
alter table public.review_reports enable row level security;
alter table public.review_audit_log enable row level security;

-- replies: public reads replies on published reviews; owners reply once on own
-- cars and may edit within 48h; admins manage all. No owner delete.
drop policy if exists "replies_public_read" on public.review_replies;
drop policy if exists "replies_owner_insert" on public.review_replies;
drop policy if exists "replies_owner_update" on public.review_replies;
drop policy if exists "replies_admin" on public.review_replies;
create policy "replies_public_read" on public.review_replies for select
  using (exists (select 1 from public.reviews r where r.id = review_id and r.status = 'published'));
create policy "replies_owner_insert" on public.review_replies for insert
  with check (
    owner_id = auth.uid()
    and exists (
      select 1 from public.reviews r
      where r.id = review_id and r.owner_id = auth.uid() and r.status = 'published'
    )
  );
create policy "replies_owner_update" on public.review_replies for update
  using (owner_id = auth.uid() and created_at > now() - interval '48 hours');
create policy "replies_admin" on public.review_replies for all using (public.is_admin());

-- helpful votes: anyone logged in votes once; public read
drop policy if exists "helpful_read" on public.review_helpful_votes;
drop policy if exists "helpful_insert" on public.review_helpful_votes;
drop policy if exists "helpful_delete" on public.review_helpful_votes;
create policy "helpful_read" on public.review_helpful_votes for select using (true);
create policy "helpful_insert" on public.review_helpful_votes for insert with check (user_id = auth.uid());
create policy "helpful_delete" on public.review_helpful_votes for delete using (user_id = auth.uid());

-- reports: parties flag; admins manage
drop policy if exists "reports_insert" on public.review_reports;
drop policy if exists "reports_read" on public.review_reports;
drop policy if exists "reports_admin" on public.review_reports;
create policy "reports_insert" on public.review_reports for insert
  with check (
    reported_by = auth.uid()
    and exists (
      select 1 from public.reviews r
      where r.id = review_id and (r.customer_id = auth.uid() or r.owner_id = auth.uid() or public.is_admin())
    )
  );
create policy "reports_read" on public.review_reports for select
  using (reported_by = auth.uid() or public.is_admin());
create policy "reports_admin" on public.review_reports for update using (public.is_admin());

-- audit log: written by service role only; admins read
drop policy if exists "audit_admin_read" on public.review_audit_log;
create policy "audit_admin_read" on public.review_audit_log for select using (public.is_admin());

-- payments: parties + admin
drop policy if exists "payments_read" on public.payments;
create policy "payments_read" on public.payments for select
  using (public.is_admin() or exists (
    select 1 from public.bookings b
    where b.id = booking_id and (b.customer_id = auth.uid() or b.owner_id = auth.uid())
  ));

-- notifications: own only
drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own" on public.notifications for all
  using (user_id = auth.uid() or public.is_admin());

-- kyc docs: own + admin
drop policy if exists "kyc_own" on public.kyc_documents;
create policy "kyc_own" on public.kyc_documents for all
  using (user_id = auth.uid() or public.is_admin());

-- ── Feature columns (idempotent) ────────────────────────────────────────────
alter table public.users add column if not exists avg_response_minutes int;
alter table public.users add column if not exists referral_code text unique;
alter table public.users add column if not exists referred_by uuid references public.users(id);
alter table public.users add column if not exists preferred_currency text default 'RWF' check (preferred_currency in ('RWF','USD'));
alter table public.users add column if not exists preferred_locale text default 'en' check (preferred_locale in ('en','rw','fr'));

alter table public.vehicles add column if not exists payment_methods text[] not null default '{cash,momo,card}';
alter table public.vehicles add column if not exists airport_approved boolean not null default false;

-- reviews: upgrade path for databases created before the review system
alter table public.reviews add column if not exists owner_id uuid references public.users(id);
alter table public.reviews add column if not exists title text;
alter table public.reviews add column if not exists photos jsonb not null default '[]'::jsonb;
alter table public.reviews add column if not exists tags text[] not null default '{}';
alter table public.reviews add column if not exists status text not null default 'published';
alter table public.reviews add column if not exists flagged_by uuid[] not null default '{}';
alter table public.reviews add column if not exists flag_reason text;
alter table public.reviews add column if not exists admin_note text;
alter table public.reviews add column if not exists removed_by uuid references public.users(id);
alter table public.reviews add column if not exists removed_at timestamptz;
alter table public.reviews add column if not exists removal_reason text;
alter table public.reviews add column if not exists edited_at timestamptz;
alter table public.reviews add column if not exists edit_count int not null default 0;
alter table public.reviews add column if not exists is_verified_booking boolean not null default true;
alter table public.reviews add column if not exists helpful_count int not null default 0;
alter table public.reviews add column if not exists updated_at timestamptz not null default now();
-- backfill owner_id from the booking
update public.reviews r set owner_id = b.owner_id
from public.bookings b where b.id = r.booking_id and r.owner_id is null;

-- notifications: allow the 'review' type
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('booking','payment','kyc','system','promo','review'));

alter table public.bookings add column if not exists qr_token text;
alter table public.bookings add column if not exists picked_up_at timestamptz;
alter table public.bookings add column if not exists returned_at timestamptz;
alter table public.bookings add column if not exists owner_response_deadline timestamptz;
alter table public.bookings add column if not exists owner_responded_at timestamptz;
alter table public.bookings add column if not exists points_redeemed int not null default 0;
alter table public.bookings add column if not exists points_earned int not null default 0;
alter table public.bookings add column if not exists corporate_account_id uuid;
alter table public.bookings add column if not exists cost_center text;
alter table public.bookings add column if not exists po_number text;

-- ── Feature tables ──────────────────────────────────────────────────────────
create table if not exists public.search_queries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  raw_query text not null,
  parsed_json jsonb,
  results_count int default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_availability (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  date date not null,
  status text not null default 'blocked' check (status in ('blocked','available')),
  unique (vehicle_id, date)
);

create table if not exists public.locations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  province text not null,
  lat double precision,
  lng double precision,
  is_popular boolean not null default false
);

create table if not exists public.loyalty_points (
  user_id uuid primary key references public.users(id) on delete cascade,
  points int not null default 0,
  tier text not null default 'bronze' check (tier in ('bronze','silver','gold','platinum')),
  updated_at timestamptz not null default now()
);

create table if not exists public.points_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  delta int not null, -- +earned / -redeemed
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references public.users(id) on delete cascade,
  referee_id uuid references public.users(id) on delete set null,
  code text not null,
  status text not null default 'pending' check (status in ('pending','completed','rewarded')),
  reward_amount int not null default 0, -- RWF discount credited
  created_at timestamptz not null default now()
);

create table if not exists public.inspections (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  type text not null check (type in ('pickup','return')),
  photos text[] not null default '{}',
  customer_signature text, -- storage URL or data-url
  owner_signature text,
  notes text,
  fuel_level int check (fuel_level between 0 and 100),
  odometer_km int,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.sos_alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  type text not null check (type in ('accident','breakdown','safety','other')),
  lat double precision,
  lng double precision,
  status text not null default 'open' check (status in ('open','acknowledged','resolved')),
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null,
  cover_image text,
  category text not null default 'travel' check (category in ('travel','tips','news','destinations')),
  tags text[] not null default '{}',
  author_id uuid references public.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

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
  amount int not null, -- RWF
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue')),
  created_at timestamptz not null default now()
);

create table if not exists public.airport_bookings (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  flight_number text not null,
  arrival_time timestamptz,
  terminal text,
  meet_greet boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.currency_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  preferred_currency text not null default 'RWF' check (preferred_currency in ('RWF','USD')),
  updated_at timestamptz not null default now()
);

-- ── Feature RLS ─────────────────────────────────────────────────────────────
alter table public.search_queries enable row level security;
alter table public.vehicle_availability enable row level security;
alter table public.locations enable row level security;
alter table public.loyalty_points enable row level security;
alter table public.points_transactions enable row level security;
alter table public.referrals enable row level security;
alter table public.inspections enable row level security;
alter table public.sos_alerts enable row level security;
alter table public.posts enable row level security;
alter table public.corporate_accounts enable row level security;
alter table public.corporate_members enable row level security;
alter table public.invoices enable row level security;
alter table public.airport_bookings enable row level security;
alter table public.currency_preferences enable row level security;

drop policy if exists "sq_insert" on public.search_queries;
drop policy if exists "sq_read" on public.search_queries;
create policy "sq_insert" on public.search_queries for insert with check (true);
create policy "sq_read" on public.search_queries for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "va_read" on public.vehicle_availability;
drop policy if exists "va_owner_write" on public.vehicle_availability;
create policy "va_read" on public.vehicle_availability for select using (true);
create policy "va_owner_write" on public.vehicle_availability for all
  using (exists (select 1 from public.vehicles v where v.id = vehicle_id and (v.owner_id = auth.uid() or public.is_admin())));

drop policy if exists "locations_read" on public.locations;
create policy "locations_read" on public.locations for select using (true);

drop policy if exists "loyalty_own" on public.loyalty_points;
create policy "loyalty_own" on public.loyalty_points for all
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "pts_own" on public.points_transactions;
create policy "pts_own" on public.points_transactions for all
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "referrals_own" on public.referrals;
create policy "referrals_own" on public.referrals for all
  using (referrer_id = auth.uid() or referee_id = auth.uid() or public.is_admin());

drop policy if exists "inspections_parties" on public.inspections;
create policy "inspections_parties" on public.inspections for all
  using (public.is_admin() or exists (
    select 1 from public.bookings b
    where b.id = booking_id and (b.customer_id = auth.uid() or b.owner_id = auth.uid())
  ));

drop policy if exists "sos_insert" on public.sos_alerts;
drop policy if exists "sos_read" on public.sos_alerts;
drop policy if exists "sos_admin_update" on public.sos_alerts;
create policy "sos_insert" on public.sos_alerts for insert with check (user_id = auth.uid());
create policy "sos_read" on public.sos_alerts for select
  using (user_id = auth.uid() or public.is_admin());
create policy "sos_admin_update" on public.sos_alerts for update using (public.is_admin());

drop policy if exists "posts_public_read" on public.posts;
drop policy if exists "posts_admin_write" on public.posts;
create policy "posts_public_read" on public.posts for select
  using (published_at is not null or public.is_admin());
create policy "posts_admin_write" on public.posts for all using (public.is_admin());

drop policy if exists "corp_read" on public.corporate_accounts;
drop policy if exists "corp_insert" on public.corporate_accounts;
drop policy if exists "corp_admin_update" on public.corporate_accounts;
create policy "corp_insert" on public.corporate_accounts for insert with check (true);
create policy "corp_read" on public.corporate_accounts for select
  using (public.is_admin() or exists (
    select 1 from public.corporate_members m where m.account_id = id and m.user_id = auth.uid()
  ));
create policy "corp_admin_update" on public.corporate_accounts for update using (public.is_admin());

drop policy if exists "corp_members_read" on public.corporate_members;
drop policy if exists "corp_members_admin" on public.corporate_members;
create policy "corp_members_read" on public.corporate_members for select
  using (user_id = auth.uid() or public.is_admin());
create policy "corp_members_admin" on public.corporate_members for all using (public.is_admin());

drop policy if exists "invoices_read" on public.invoices;
drop policy if exists "invoices_admin" on public.invoices;
create policy "invoices_read" on public.invoices for select
  using (public.is_admin() or exists (
    select 1 from public.corporate_members m where m.account_id = account_id and m.user_id = auth.uid()
  ));
create policy "invoices_admin" on public.invoices for all using (public.is_admin());

drop policy if exists "airport_parties" on public.airport_bookings;
create policy "airport_parties" on public.airport_bookings for all
  using (public.is_admin() or exists (
    select 1 from public.bookings b
    where b.id = booking_id and (b.customer_id = auth.uid() or b.owner_id = auth.uid())
  ));

drop policy if exists "currency_own" on public.currency_preferences;
create policy "currency_own" on public.currency_preferences for all
  using (user_id = auth.uid() or public.is_admin());

-- ── Email (Postmark) audit trail ────────────────────────────────────────────
alter table public.users add column if not exists email_suppressed boolean not null default false;

create table if not exists public.email_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  template_slug text not null,
  to_email text not null,
  subject text not null,
  status text not null default 'queued'
    check (status in ('queued','sent','delivered','opened','clicked','bounced','spam','failed','skipped')),
  locale text not null default 'en',
  idempotency_key text,
  postmark_message_id text,
  error text,
  data jsonb,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists email_logs_user_idx on public.email_logs(user_id, created_at desc);
create index if not exists email_logs_to_idx on public.email_logs(to_email, created_at desc);
create index if not exists email_logs_msg_idx on public.email_logs(postmark_message_id);
create unique index if not exists email_logs_idem_idx on public.email_logs(idempotency_key)
  where idempotency_key is not null and status in ('sent','delivered','opened','clicked');

create table if not exists public.email_events (
  id uuid primary key default uuid_generate_v4(),
  postmark_message_id text,
  record_type text not null,
  recipient text,
  tag text,
  detail text,
  user_agent text,
  geo jsonb,
  payload jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists email_events_msg_idx on public.email_events(postmark_message_id);

alter table public.email_logs enable row level security;
alter table public.email_events enable row level security;

-- Written only by the service role (API routes). Admins may read; users may read their own logs.
drop policy if exists "email_logs_read" on public.email_logs;
create policy "email_logs_read" on public.email_logs for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "email_events_admin_read" on public.email_events;
create policy "email_events_admin_read" on public.email_events for select using (public.is_admin());

-- ── Locations seed (curated Rwanda dataset) ─────────────────────────────────
insert into public.locations (name, province, lat, lng, is_popular) values
  ('Kigali — Gasabo', 'Kigali City', -1.9351, 30.0827, true),
  ('Kigali — Kicukiro', 'Kigali City', -1.9706, 30.1027, true),
  ('Kigali — Nyarugenge', 'Kigali City', -1.9536, 30.0605, true),
  ('Kigali International Airport', 'Kigali City', -1.9686, 30.1395, true),
  ('Musanze', 'Northern', -1.4998, 29.6350, true),
  ('Rubavu', 'Western', -1.6794, 29.3564, true),
  ('Huye', 'Southern', -2.5967, 29.7389, true),
  ('Nyagatare', 'Eastern', -1.2969, 30.3270, false),
  ('Rusizi', 'Western', -2.4836, 28.9074, false),
  ('Muhanga', 'Southern', -2.0833, 29.7500, false),
  ('Rwamagana', 'Eastern', -1.9487, 30.4347, false),
  ('Karongi', 'Western', -2.0000, 29.3833, false),
  ('Nyamata', 'Eastern', -2.1439, 30.0836, false),
  ('Gicumbi', 'Northern', -1.5833, 30.0667, false),
  ('Nyanza', 'Southern', -2.3500, 29.7500, false)
on conflict do nothing;

-- ── Seed data ───────────────────────────────────────────────────────────────
-- Auth users must be created through Supabase Auth (they need matching rows in
-- auth.users). Run `node scripts/seed.mjs` instead — it creates auth users via
-- the admin API, then inserts profiles, vehicles and bookings.
