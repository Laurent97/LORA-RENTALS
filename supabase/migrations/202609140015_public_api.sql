-- LORA public API & developer platform (T4P15)

create table if not exists public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  key text not null unique,
  scopes text[] not null default '{}',
  last_used timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_keys_user on public.api_keys(user_id);

alter table public.api_keys enable row level security;

drop policy if exists "api_keys_own" on public.api_keys;
create policy "api_keys_own" on public.api_keys for all using (user_id = auth.uid() or public.is_admin());
