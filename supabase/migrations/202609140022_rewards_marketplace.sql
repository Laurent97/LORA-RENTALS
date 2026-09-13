-- LORA rewards marketplace (BonusP22)

create table if not exists public.rewards_catalog (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  label text not null,
  description text,
  partner_name text,
  points_cost int not null,
  stock int default null,
  status text not null default 'available' check (status in ('available','out_of_stock','discontinued')),
  created_at timestamptz not null default now()
);

create table if not exists public.user_rewards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  reward_id uuid not null references public.rewards_catalog(id),
  status text not null default 'pending' check (status in ('pending','redeemed','cancelled')),
  code text,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_rewards_user on public.user_rewards(user_id, created_at desc);
create index if not exists idx_rewards_catalog_status on public.rewards_catalog(status);

alter table public.rewards_catalog enable row level security;
alter table public.user_rewards enable row level security;

drop policy if exists "rewards_catalog_public" on public.rewards_catalog;
drop policy if exists "user_rewards_own" on public.user_rewards;

create policy "rewards_catalog_public" on public.rewards_catalog for select using (status = 'available');
create policy "user_rewards_own" on public.user_rewards for all using (user_id = auth.uid() or public.is_admin());
