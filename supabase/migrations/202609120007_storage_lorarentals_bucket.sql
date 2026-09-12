-- Create the public "lorarentals" bucket used by KYC and inspection photo uploads.
-- Safe to re-run.

insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types, owner)
select gen_random_uuid(), 'lorarentals', true, false, 8388608, null, null
where not exists (select 1 from storage.buckets where name = 'lorarentals');

alter table storage.objects enable row level security;

-- Public read access for signed/public URLs
drop policy if exists "lorarentals_public_select" on storage.objects;
create policy "lorarentals_public_select" on storage.objects
  for select to public
  using (bucket_id = (select id from storage.buckets where name = 'lorarentals'));

-- Authenticated users can upload KYC docs to their own kyc/<user_id>/... path
drop policy if exists "lorarentals_kyc_upload" on storage.objects;
create policy "lorarentals_kyc_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = (select id from storage.buckets where name = 'lorarentals')
    and (storage.foldername(name))[1] = 'kyc'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Authenticated users can update their own KYC docs
drop policy if exists "lorarentals_kyc_update" on storage.objects;
create policy "lorarentals_kyc_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = (select id from storage.buckets where name = 'lorarentals')
    and (storage.foldername(name))[1] = 'kyc'
    and (storage.foldername(name))[2] = auth.uid()::text
  )
  with check (
    bucket_id = (select id from storage.buckets where name = 'lorarentals')
    and (storage.foldername(name))[1] = 'kyc'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Authenticated users can upload inspection photos to inspections/<booking_id>/...
drop policy if exists "lorarentals_inspections_upload" on storage.objects;
create policy "lorarentals_inspections_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = (select id from storage.buckets where name = 'lorarentals')
    and (storage.foldername(name))[1] = 'inspections'
  );
