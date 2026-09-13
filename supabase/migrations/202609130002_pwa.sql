create table if not exists public.pwa_events (
  id uuid primary key default uuid_generate_v4(),
  event text not null check (event like 'pwa_%'),
  properties jsonb not null default '{}'::jsonb,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists pwa_events_event_created_idx on public.pwa_events(event, created_at desc);

create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pwa_events enable row level security;
alter table public.push_subscriptions enable row level security;
-- Only server-side service-role API routes write these tables. Administrators can inspect event data.
drop policy if exists "pwa_events_admin_read" on public.pwa_events;
create policy "pwa_events_admin_read" on public.pwa_events for select using (public.is_admin());
drop policy if exists "push_subscriptions_admin_read" on public.push_subscriptions;
create policy "push_subscriptions_admin_read" on public.push_subscriptions for select using (public.is_admin());
