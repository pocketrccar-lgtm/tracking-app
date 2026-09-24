-- v3 · Step B — add the Vertical table + verticalId (2026-09-24, db-council ruling).
-- Additive only (no DROP / ALTER TYPE / NOT NULL). The column DEFAULT stamps every existing
-- row 'pocket-rc' instantly, so the Vertical rows are inserted BEFORE the foreign keys.
-- Rehearsed on a restored copy of production: 0 NULLs, 0 drift afterwards.
SET lock_timeout = '2s';
BEGIN;
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "verticalId" TEXT DEFAULT 'pocket-rc';

-- AlterTable
ALTER TABLE "Playbook" ADD COLUMN     "verticalId" TEXT DEFAULT 'pocket-rc';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "verticalId" TEXT DEFAULT 'pocket-rc';

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "verticalId" TEXT DEFAULT 'pocket-rc';

-- CreateTable
CREATE TABLE "Vertical" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vertical_pkey" PRIMARY KEY ("id")
);

-- Seed the verticals BEFORE any FK is added: the column DEFAULT has already stamped every
-- existing row 'pocket-rc', so the FK needs that row to exist.
INSERT INTO "Vertical" ("id","name","color","order") VALUES
  ('pocket-rc','Pocket RC','red',0),
  ('ev-scooters','EV Scooters','emerald',1)
ON CONFLICT ("id") DO NOTHING;

-- Born protected: Supabase auto-grants new tables to anon/authenticated.
ALTER TABLE "Vertical" ENABLE ROW LEVEL SECURITY;

-- CreateIndex
CREATE UNIQUE INDEX "Vertical_name_key" ON "Vertical"("name");

-- CreateIndex
CREATE INDEX "Category_verticalId_idx" ON "Category"("verticalId");

-- CreateIndex
CREATE INDEX "Playbook_verticalId_idx" ON "Playbook"("verticalId");

-- CreateIndex
CREATE INDEX "Task_verticalId_status_idx" ON "Task"("verticalId", "status");

-- CreateIndex
CREATE INDEX "Vendor_verticalId_status_idx" ON "Vendor"("verticalId", "status");

-- CreateIndex
CREATE INDEX "Vendor_verticalId_rank_idx" ON "Vendor"("verticalId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_verticalId_name_key" ON "Vendor"("verticalId", "name");

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playbook" ADD CONSTRAINT "Playbook_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_verticalId_fkey" FOREIGN KEY ("verticalId") REFERENCES "Vertical"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


COMMIT;
