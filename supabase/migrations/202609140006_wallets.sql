-- LORA in-app wallet (T2P6)

create table if not exists public.wallets (
  user_id uuid primary key references public.users(id) on delete cascade,
  balance int not null default 0, -- RWF
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount int not null, -- positive = credit, negative = debit
  type text not null check (type in ('topup','refund','referral','promo','payment','payout')),
  booking_id uuid references public.bookings(id),
  status text not null default 'pending' check (status in ('pending','completed','cancelled')),
  method text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_transactions_user on public.wallet_transactions(user_id, created_at desc);
create index if not exists idx_wallet_transactions_status on public.wallet_transactions(status);

-- wallet balance is auto-updated when a transaction is marked completed
create or replace function public.apply_wallet_transaction()
returns trigger language plpgsql as $$
begin
  if new.status = 'completed' then
    update public.wallets
    set balance = balance + new.amount, updated_at = now()
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_apply_wallet_transaction on public.wallet_transactions;
create trigger trg_apply_wallet_transaction
after insert or update on public.wallet_transactions
for each row execute function public.apply_wallet_transaction();

-- ensure a wallet row exists on user insert
create or replace function public.ensure_user_wallet()
returns trigger language plpgsql as $$
begin
  insert into public.wallets (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ensure_user_wallet on public.users;
create trigger trg_ensure_user_wallet
after insert on public.users
for each row execute function public.ensure_user_wallet();

alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;

drop policy if exists "wallets_own" on public.wallets;
drop policy if exists "wallet_transactions_own" on public.wallet_transactions;

create policy "wallets_own" on public.wallets for all
  using (user_id = auth.uid() or public.is_admin());
create policy "wallet_transactions_own" on public.wallet_transactions for all
  using (user_id = auth.uid() or public.is_admin());
