-- LORA multi-dimensional Trust Score (T1P2)

create table if not exists public.user_trust_scores (
  user_id uuid primary key references public.users(id) on delete cascade,
  total int not null default 0,
  kyc int not null default 0,
  response int not null default 0,
  cancellation int not null default 0,
  rating int not null default 0,
  damage int not null default 0,
  punctuality int not null default 0,
  repeat_customer int not null default 0,
  dispute int not null default 0,
  tier text not null default 'bronze' check (tier in ('bronze','silver','gold','platinum','diamond')),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_trust_scores_total on public.user_trust_scores(total desc);
create index if not exists idx_user_trust_scores_tier on public.user_trust_scores(tier);

alter table public.user_trust_scores enable row level security;

drop policy if exists "user_trust_scores_public_read" on public.user_trust_scores;
drop policy if exists "user_trust_scores_admin_write" on public.user_trust_scores;

create policy "user_trust_scores_public_read" on public.user_trust_scores for select using (true);
create policy "user_trust_scores_admin_write" on public.user_trust_scores for all using (public.is_admin());
