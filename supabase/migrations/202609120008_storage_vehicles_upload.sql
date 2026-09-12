-- Allow authenticated owners to upload vehicle photos to vehicles/<user_id>/...
-- This works alongside the `lorarentals` bucket created in migration 202609120007.

drop policy if exists "lorarentals_vehicles_upload" on storage.objects;

create policy "lorarentals_vehicles_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = (select id from storage.buckets where name = 'lorarentals')
    and (storage.foldername(name))[1] = 'vehicles'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
