-- LORA video KYC onboarding (BonusP21)

create table if not exists public.video_kyc_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','submitted','approved','rejected')),
  recording_url text,
  selfie_url text,
  document_front_url text,
  document_back_url text,
  liveness_score numeric(4,3),
  reviewer_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_video_kyc_user on public.video_kyc_sessions(user_id);
create index if not exists idx_video_kyc_status on public.video_kyc_sessions(status);

alter table public.video_kyc_sessions enable row level security;

drop policy if exists "video_kyc_own" on public.video_kyc_sessions;
create policy "video_kyc_own" on public.video_kyc_sessions for all using (user_id = auth.uid() or public.is_admin());
