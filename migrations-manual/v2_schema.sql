-- v2 schema migration — run ONCE in Supabase → SQL Editor → New query → paste → Run.
-- Idempotent + safe to re-run.

-- Vendor: social links + primary category
ALTER TABLE "Vendor"
  ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "youtubeUrl"   TEXT,
  ADD COLUMN IF NOT EXISTS "indiamartUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "categoryId"   TEXT;

-- Category: ordering
ALTER TABLE "Category"
  ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

-- Task: vendor is now optional
ALTER TABLE "Task" ALTER COLUMN "vendorId" DROP NOT NULL;

-- Playbook: research funnels stored in-app
CREATE TABLE IF NOT EXISTS "Playbook" (
  "id"         TEXT NOT NULL,
  "categoryId" TEXT,
  "title"      TEXT NOT NULL,
  "kind"       TEXT NOT NULL DEFAULT 'OTHER',
  "content"    TEXT NOT NULL,
  "order"      INTEGER NOT NULL DEFAULT 0,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Playbook_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Playbook_categoryId_idx" ON "Playbook"("categoryId");

-- Foreign keys (guarded against re-run)
DO $$ BEGIN
  ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Playbook" ADD CONSTRAINT "Playbook_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
