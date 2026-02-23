-- Hakediş Migration SQL

-- Create enums
DO $$ BEGIN
  CREATE TYPE "HakedisType" AS ENUM ('ISVEREN', 'TASERON');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "HakedisStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create hakedis table
CREATE TABLE IF NOT EXISTS "hakedis" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "company_id" TEXT,
  "type" "HakedisType" NOT NULL,
  "no" INTEGER NOT NULL,
  "period" TEXT NOT NULL,
  "start_date" TIMESTAMP(3),
  "end_date" TIMESTAMP(3),
  "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "previous_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "current_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "advance_deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "retention_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "retention_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "stamp_tax" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "other_deduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "net_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "HakedisStatus" NOT NULL DEFAULT 'DRAFT',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hakedis_pkey" PRIMARY KEY ("id")
);

-- Create hakedis_items table
CREATE TABLE IF NOT EXISTS "hakedis_items" (
  "id" TEXT NOT NULL,
  "hakedis_id" TEXT NOT NULL,
  "poz_no" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "contract_qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "unit_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "previous_qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "current_qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "cumulative_qty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hakedis_items_pkey" PRIMARY KEY ("id")
);

-- Create foreign keys
ALTER TABLE "hakedis" ADD CONSTRAINT "hakedis_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hakedis" ADD CONSTRAINT "hakedis_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hakedis_items" ADD CONSTRAINT "hakedis_items_hakedis_id_fkey" FOREIGN KEY ("hakedis_id") REFERENCES "hakedis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

SELECT 'Hakediş migration completed successfully!' as result;
