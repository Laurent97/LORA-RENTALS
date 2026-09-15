-- Audit log for every badge scan/verification attempt

create table if not exists public.badge_verifications (
  id uuid primary key default uuid_generate_v4(),
  badge_id uuid references public.driver_badges(id) on delete set null,
  driver_id uuid not null references public.drivers(id) on delete cascade,
  badge_number text not null,
  token text not null,
  status text not null default 'success' check (status in ('success', 'failed', 'expired', 'revoked')),
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_badge_verifications_badge_id on public.badge_verifications(badge_id);
create index if not exists idx_badge_verifications_driver_id on public.badge_verifications(driver_id);
create index if not exists idx_badge_verifications_badge_number on public.badge_verifications(badge_number);
create index if not exists idx_badge_verifications_created_at on public.badge_verifications(created_at);
