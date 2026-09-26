-- v3 · Step C — third vertical "EV Batteries" (2026-09-26, db-council ruling).
-- Data only: one row in "Vertical". No schema change; the vendors are inserted afterwards by
-- scripts/import-vertical.ts (insert-only, scoped to this vertical).
--
-- Rollback — ONLY while nobody has worked the list yet. Every Vendor child FK cascades
-- (VendorPhone, VendorEmail, Interaction, Task, Product, PurchaseOrder, VendorCategory), so the
-- DELETE below would also silently wipe logged calls, tasks and POs on these vendors. First check
-- that all of these are 0, and export them if not:
--   SELECT (SELECT count(*) FROM "Interaction" i JOIN "Vendor" v ON v.id=i."vendorId" WHERE v."verticalId"='ev-batteries'),
--          (SELECT count(*) FROM "Task" WHERE "verticalId"='ev-batteries' OR "vendorId" IN (SELECT id FROM "Vendor" WHERE "verticalId"='ev-batteries')),
--          (SELECT count(*) FROM "Product" p JOIN "Vendor" v ON v.id=p."vendorId" WHERE v."verticalId"='ev-batteries'),
--          (SELECT count(*) FROM "PurchaseOrder" o JOIN "Vendor" v ON v.id=o."vendorId" WHERE v."verticalId"='ev-batteries'),
--          (SELECT count(*) FROM "VendorCategory" c JOIN "Vendor" v ON v.id=c."vendorId" WHERE v."verticalId"='ev-batteries'),
--          -- edits to the vendor rows themselves (status, notes, phones re-saved) leave no child rows:
--          (SELECT count(*) FROM "Vendor" WHERE "verticalId"='ev-batteries' AND "updatedAt" > "createdAt" + interval '5 seconds');
-- Then:
--   DELETE FROM "Vendor" WHERE "verticalId" = 'ev-batteries';
--   DELETE FROM "Vertical" WHERE "id" = 'ev-batteries';
SET lock_timeout = '2s';
BEGIN;
INSERT INTO "Vertical" ("id","name","color","order") VALUES
  ('ev-batteries','EV Batteries','amber',2)
ON CONFLICT ("id") DO NOTHING;
COMMIT;
