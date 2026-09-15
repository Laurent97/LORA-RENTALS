-- Driver ID badges for LORA-verified chauffeurs

create table if not exists public.driver_badges (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references public.drivers(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete cascade,
  badge_number text not null unique,
  verification_token text not null,
  qr_url text,
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked', 'expired')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 year'),
  revoked_at timestamptz,
  revoked_by uuid references public.users(id) on delete set null,
  revoke_reason text,
  pdf_url text,
  pdf_generated_at timestamptz,
  verify_count int not null default 0,
  last_verified_at timestamptz,
  last_verified_ip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_driver_badges_driver_id on public.driver_badges(driver_id);
create index if not exists idx_driver_badges_owner_id on public.driver_badges(owner_id);
create index if not exists idx_driver_badges_badge_number on public.driver_badges(badge_number);
create index if not exists idx_driver_badges_status on public.driver_badges(status);
