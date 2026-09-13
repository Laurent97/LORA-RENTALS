-- LORA referral 2.0 (T3P12)

-- existing public.referrals already tracks referee/referrer; this adds multi-tier rewards

create table if not exists public.referral_rewards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  reward_type text not null check (reward_type in ('team','corporate','owner','social','influencer')),
  amount int not null default 0, -- RWF
  status text not null default 'pending' check (status in ('pending','credited','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_rewards_user on public.referral_rewards(user_id, status);
create index if not exists idx_referral_rewards_referral on public.referral_rewards(referral_id);

alter table public.referral_rewards enable row level security;

drop policy if exists "referral_rewards_own" on public.referral_rewards;

create policy "referral_rewards_own" on public.referral_rewards for all
  using (user_id = auth.uid() or public.is_admin());
