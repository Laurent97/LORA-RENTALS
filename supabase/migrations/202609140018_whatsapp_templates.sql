-- LORA WhatsApp Business API full integration (T5P18)

create table if not exists public.whatsapp_templates (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  label text not null,
  language text not null default 'en',
  category text not null default 'transactional' check (category in ('transactional','marketing','utility','authentication')),
  body text not null,
  variables text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  phone text not null,
  direction text not null check (direction in ('inbound','outbound')),
  template_slug text references public.whatsapp_templates(slug),
  body text not null,
  message_id text,
  status text not null default 'sent' check (status in ('sent','delivered','read','failed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_conversations_user on public.whatsapp_conversations(user_id, created_at desc);
create index if not exists idx_whatsapp_conversations_phone on public.whatsapp_conversations(phone, created_at desc);

alter table public.whatsapp_templates enable row level security;
alter table public.whatsapp_conversations enable row level security;

drop policy if exists "whatsapp_templates_public" on public.whatsapp_templates;
drop policy if exists "whatsapp_conversations_own" on public.whatsapp_conversations;

create policy "whatsapp_templates_public" on public.whatsapp_templates for select using (status = 'approved');
create policy "whatsapp_conversations_own" on public.whatsapp_conversations for all using (user_id = auth.uid() or public.is_admin());
