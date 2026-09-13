-- LORA gamification & loyalty 2.0 (T3P11)

create table if not exists public.badges (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  label text not null,
  description text,
  icon text,
  points_bonus int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_badges (
  user_id uuid not null references public.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table if not exists public.challenges (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  label text not null,
  description text,
  points int not null default 0,
  condition jsonb not null default '{}',
  start_at timestamptz,
  end_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_challenges (
  user_id uuid not null references public.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','completed','rewarded')),
  progress int not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (user_id, challenge_id)
);

create index if not exists idx_user_badges_user on public.user_badges(user_id, awarded_at desc);
create index if not exists idx_user_challenges_user on public.user_challenges(user_id, status);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.challenges enable row level security;
alter table public.user_challenges enable row level security;

drop policy if exists "badges_public_read" on public.badges;
drop policy if exists "user_badges_public_read" on public.user_badges;
drop policy if exists "challenges_public_read" on public.challenges;
drop policy if exists "user_challenges_own" on public.user_challenges;

create policy "badges_public_read" on public.badges for select using (true);
create policy "user_badges_public_read" on public.user_badges for select using (true);
create policy "challenges_public_read" on public.challenges for select using (true);
create policy "user_challenges_own" on public.user_challenges for all using (user_id = auth.uid() or public.is_admin());
