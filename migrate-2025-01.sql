-- ═══════════════════════════════════════════════════════════
-- Şantiye360 – Canlı DB Migrasyon (2025-01)
-- REST_DAY_WORK, CollarType, EmployeeDiscounts, 
-- ProjectWorkerAssignment, eksik worker sütunları
-- ═══════════════════════════════════════════════════════════

-- 1) AttendanceStatus enum'a REST_DAY_WORK ekle
DO $$ BEGIN
  ALTER TYPE "AttendanceStatus" ADD VALUE IF NOT EXISTS 'REST_DAY_WORK';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) CollarType enum oluştur
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CollarType') THEN
    CREATE TYPE "CollarType" AS ENUM ('WHITE', 'BLUE');
  END IF;
END $$;

-- 3) Workers tablosuna eksik sütunlar
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "collar_type" "CollarType" NOT NULL DEFAULT 'BLUE';
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "identity_no" TEXT;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "daily_rate" DOUBLE PRECISION;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "overtime_rate" DOUBLE PRECISION;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "position" TEXT;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "blood_type" TEXT;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "emergency_contact" TEXT;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "emergency_phone" TEXT;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "start_date" DATE;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "end_date" DATE;
ALTER TABLE "workers" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 4) ProjectWorkerAssignment tablosu
CREATE TABLE IF NOT EXISTS "project_worker_assignments" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "project_id" TEXT NOT NULL,
  "worker_id" TEXT NOT NULL,
  "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "removed_at" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "project_worker_assignments_pkey" PRIMARY KEY ("id")
);

-- FK'lar
ALTER TABLE "project_worker_assignments" DROP CONSTRAINT IF EXISTS "project_worker_assignments_project_id_fkey";
ALTER TABLE "project_worker_assignments" ADD CONSTRAINT "project_worker_assignments_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

ALTER TABLE "project_worker_assignments" DROP CONSTRAINT IF EXISTS "project_worker_assignments_worker_id_fkey";
ALTER TABLE "project_worker_assignments" ADD CONSTRAINT "project_worker_assignments_worker_id_fkey"
  FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE;

-- Unique index
CREATE UNIQUE INDEX IF NOT EXISTS "project_worker_assignments_project_id_worker_id_key"
  ON "project_worker_assignments"("project_id", "worker_id");

-- 5) EmployeeDiscount tablosu
CREATE TABLE IF NOT EXISTS "employee_discounts" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "company_name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "discount_rate" INTEGER NOT NULL,
  "description" TEXT,
  "logo" TEXT,
  "contact_info" TEXT,
  "valid_until" DATE,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "employee_discounts_pkey" PRIMARY KEY ("id")
);

-- 6) Deneme indirim verileri (sadece tablo boşsa ekle)
INSERT INTO "employee_discounts" ("id", "company_name", "category", "discount_rate", "description", "contact_info", "is_active", "created_at", "updated_at")
SELECT gen_random_uuid()::text, 'Tavuk Dünyası', 'Gıda', 15, 'Tüm menülerde %15 indirim. Şantiye kimlik kartı gösterilmelidir.', '0850 222 0 444', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "employee_discounts" LIMIT 1);

INSERT INTO "employee_discounts" ("id", "company_name", "category", "discount_rate", "description", "contact_info", "is_active", "created_at", "updated_at")
SELECT gen_random_uuid()::text, 'Gloria Jeans Coffees', 'Gıda', 20, 'Tüm içeceklerde %20 indirim.', 'info@gloriajeanscoffees.com.tr', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "employee_discounts" WHERE "company_name" = 'Gloria Jeans Coffees');

INSERT INTO "employee_discounts" ("id", "company_name", "category", "discount_rate", "description", "contact_info", "is_active", "created_at", "updated_at")
SELECT gen_random_uuid()::text, 'DS Damat', 'Giyim', 25, 'Takım elbise ve gömleklerde %25 indirim.', '0212 331 00 00', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "employee_discounts" WHERE "company_name" = 'DS Damat');

INSERT INTO "employee_discounts" ("id", "company_name", "category", "discount_rate", "description", "contact_info", "is_active", "created_at", "updated_at")
SELECT gen_random_uuid()::text, 'Beymen', 'Giyim', 10, 'Seçili markalarda %10 indirim.', 'musteri@beymen.com', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "employee_discounts" WHERE "company_name" = 'Beymen');

INSERT INTO "employee_discounts" ("id", "company_name", "category", "discount_rate", "description", "contact_info", "is_active", "created_at", "updated_at")
SELECT gen_random_uuid()::text, 'Big Chefs', 'Gıda', 20, 'Hafta içi öğle menülerinde %20 indirim.', '0212 999 00 00', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "employee_discounts" WHERE "company_name" = 'Big Chefs');

-- Done!
