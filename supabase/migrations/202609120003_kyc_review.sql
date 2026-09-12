alter table public.kyc_documents add column if not exists reviewed_by uuid references public.users(id);
alter table public.kyc_documents add column if not exists reviewed_at timestamptz;
alter table public.kyc_documents add column if not exists review_note text;