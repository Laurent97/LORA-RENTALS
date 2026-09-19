-- Broadcast, share, and web push infrastructure

create table if not exists broadcasts (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references users(id),
  title text not null,
  body text not null,
  cta_label text,
  cta_url text,
  image_url text,
  category text default 'announcement',
  audience_type text not null,
  audience_filter jsonb default '{}',
  channels text[] not null default array['in_app'],
  status text default 'draft',
  scheduled_for timestamptz,
  sent_at timestamptz,
  recipient_count int default 0,
  delivered_count int default 0,
  opened_count int default 0,
  clicked_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists broadcast_recipients (
  id uuid primary key default gen_random_uuid(),
  broadcast_id uuid references broadcasts(id) on delete cascade,
  user_id uuid references users(id),
  in_app_status text default 'pending',
  email_status text default 'pending',
  push_status text default 'pending',
  postmark_message_id text,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists broadcast_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  title text not null,
  body text not null,
  cta_label text,
  cta_url text,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  subscription jsonb not null,
  user_agent text,
  created_at timestamptz default now()
);

create table if not exists share_events (
  id uuid primary key default gen_random_uuid(),
  listing_type text,
  listing_id uuid not null,
  shared_by uuid references users(id),
  platform text,
  url text,
  user_agent text,
  ip_address inet,
  created_at timestamptz default now()
);

create index if not exists idx_broadcasts_status on broadcasts(status);
create index if not exists idx_broadcasts_sent on broadcasts(sent_at desc);
create index if not exists idx_broadcast_recipients_user on broadcast_recipients(user_id);
create index if not exists idx_broadcast_recipients_broadcast on broadcast_recipients(broadcast_id);
create index if not exists idx_share_events_listing on share_events(listing_type, listing_id);
create index if not exists idx_share_events_platform on share_events(platform);
