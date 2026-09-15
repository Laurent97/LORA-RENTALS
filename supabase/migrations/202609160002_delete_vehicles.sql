-- Soft-delete requested vehicles (FK-safe: keeps booking history)
UPDATE public.vehicles
SET
  status = 'unavailable',
  deleted_at = now()
WHERE id IN (
  '2106769d-ef50-4a2b-a595-fbdfc7704e13',
  '2d7691b2-780a-41e8-9c7d-958c5a888f24',
  '39e0ad7e-c003-4846-b124-f7024ec1e554',
  '3c7da918-c0dc-47aa-b1e9-16d0b28793ca',
  '41683b9e-2108-4a75-aeb2-a1b38ae109ee',
  '51b1ae33-ca8e-48b6-8db2-d9008bb6fa1d',
  '68ebe88a-081a-4384-bd80-2959e92708da',
  '833101e0-cedc-4993-b804-56aa7931d180',
  '851432a8-4018-4ed1-8420-3ebf877746fa',
  '9663458b-7529-4262-856e-a767582aace8',
  'c2b79da9-065e-4198-a2cd-f1b27997f3da',
  'e2f3dbd2-d95b-4b90-aba3-00d47ff867b4'
);
