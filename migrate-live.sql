-- Yeni enum tipleri
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ShiftType') THEN
    CREATE TYPE "ShiftType" AS ENUM ('DAY', 'NIGHT');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttendanceStatus') THEN
    CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'HALF_DAY', 'ABSENT', 'PAID_LEAVE', 'UNPAID_LEAVE', 'ANNUAL_LEAVE', 'SICK_LEAVE', 'DAY_OFF');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MaterialApprovalStatus') THEN
    CREATE TYPE "MaterialApprovalStatus" AS ENUM ('BEKLEMEDE', 'ONAYLANDI', 'REDDEDILDI', 'REVIZE');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MaterialOrderStatus') THEN
    CREATE TYPE "MaterialOrderStatus" AS ENUM ('BEKLEMEDE', 'SIPARIS_VERILDI', 'URETIMDE', 'HAZIRLANDI', 'IPTAL');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MaterialDeliveryStatus') THEN
    CREATE TYPE "MaterialDeliveryStatus" AS ENUM ('BEKLEMEDE', 'YOLDA', 'TESLIM_EDILDI', 'EKSIK_TESLIM', 'IPTAL');
  END IF;
END $$;

-- Workers tablosu
CREATE TABLE IF NOT EXISTS "workers" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "team_id" TEXT NOT NULL,
  "first_name" TEXT NOT NULL,
  "last_name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "sort_order" INT NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workers_pkey" PRIMARY KEY ("id")
);

-- Attendances tablosu
CREATE TABLE IF NOT EXISTS "attendances" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "worker_id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "shift" "ShiftType" NOT NULL DEFAULT 'DAY',
  "status" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
  "total_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "overtime" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- Material Items tablosu
CREATE TABLE IF NOT EXISTS "material_items" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "project_id" TEXT NOT NULL,
  "zone_id" TEXT NOT NULL,
  "floor_id" TEXT NOT NULL,
  "poz_no" TEXT NOT NULL,
  "order_priority" INT NOT NULL DEFAULT 0,
  "scope" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "design_approval" "MaterialApprovalStatus" NOT NULL DEFAULT 'BEKLEMEDE',
  "owner_approval" "MaterialApprovalStatus" NOT NULL DEFAULT 'BEKLEMEDE',
  "approval_note" TEXT,
  "quotation_firms" TEXT,
  "order_decision" TEXT,
  "supplier_name" TEXT,
  "supplier_contact" TEXT,
  "order_status" "MaterialOrderStatus" NOT NULL DEFAULT 'BEKLEMEDE',
  "delivery_status" "MaterialDeliveryStatus" NOT NULL DEFAULT 'BEKLEMEDE',
  "responsible_person" TEXT,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "material_items_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "workers" DROP CONSTRAINT IF EXISTS "workers_team_id_fkey";
ALTER TABLE "workers" ADD CONSTRAINT "workers_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE;

ALTER TABLE "attendances" DROP CONSTRAINT IF EXISTS "attendances_worker_id_fkey";
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE CASCADE;

ALTER TABLE "material_items" DROP CONSTRAINT IF EXISTS "material_items_project_id_fkey";
ALTER TABLE "material_items" ADD CONSTRAINT "material_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE;

ALTER TABLE "material_items" DROP CONSTRAINT IF EXISTS "material_items_zone_id_fkey";
ALTER TABLE "material_items" ADD CONSTRAINT "material_items_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE;

ALTER TABLE "material_items" DROP CONSTRAINT IF EXISTS "material_items_floor_id_fkey";
ALTER TABLE "material_items" ADD CONSTRAINT "material_items_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE CASCADE;

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "attendances_worker_id_date_shift_key" ON "attendances"("worker_id", "date", "shift");

-- teams tablosuna sort_order ve discipline_id ekle (yoksa)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'sort_order') THEN
    ALTER TABLE "teams" ADD COLUMN "sort_order" INT NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'sort_order') THEN
    ALTER TABLE "companies" ADD COLUMN "sort_order" INT NOT NULL DEFAULT 0;
  END IF;
END $$;
