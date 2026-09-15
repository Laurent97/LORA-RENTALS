-- Safety & anti-scam tables

create table if not exists public.scam_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  scam_type text not null check (scam_type in ('advance_payment','fake_account','fake_booking','fake_badge','other')),
  description text not null,
  screenshots jsonb default '[]'::jsonb,
  contact_phone text,
  contact_email text,
  status text not null default 'pending' check (status in ('pending','investigating','resolved','dismissed')),
  resolution text,
  resolved_by uuid references public.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_scam_reports_status on public.scam_reports(status);
create index if not exists idx_scam_reports_user on public.scam_reports(user_id);
create index if not exists idx_scam_reports_booking on public.scam_reports(booking_id);
create index if not exists idx_scam_reports_created on public.scam_reports(created_at desc);

create table if not exists public.safety_acknowledgments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  acknowledged_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  version text not null default '1.0'
);

create index if not exists idx_safety_ack_user on public.safety_acknowledgments(user_id);
create index if not exists idx_safety_ack_booking on public.safety_acknowledgments(booking_id);
