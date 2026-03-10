-- =============================================
-- Yatırım & GYO Modülü - Migration
-- =============================================

-- Enumlar
DO $$ BEGIN
  CREATE TYPE "InvestmentProjectType" AS ENUM ('KONUT', 'AVM', 'OTEL', 'OFIS', 'ARSA', 'KARMA');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvestmentProjectStatus" AS ENUM ('FIZIBILITE', 'INSAAT', 'SATISTA', 'TAMAMLANDI', 'IPTAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "UnitType" AS ENUM ('DAIRE_1_1', 'DAIRE_2_1', 'DAIRE_3_1', 'DAIRE_4_1', 'DUKKAN', 'OFIS', 'VILLA', 'DIGER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "UnitStatus" AS ENUM ('BOS', 'OPSIYONLU', 'SATILDI', 'TESLIM_EDILDI');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentType" AS ENUM ('PESINAT', 'TAKSIT', 'ARA_ODEME', 'TESLIMDE', 'DIGER');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM ('BEKLENIYOR', 'ODENDI', 'GECIKTI', 'IPTAL');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "FeasibilityType" AS ENUM ('MALIYET', 'GELIR');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CashFlowType" AS ENUM ('GIRIS', 'CIKIS');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tablolar
CREATE TABLE IF NOT EXISTS "investment_projects" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "InvestmentProjectType" NOT NULL DEFAULT 'KONUT',
  "status" "InvestmentProjectStatus" NOT NULL DEFAULT 'FIZIBILITE',
  "city" TEXT,
  "district" TEXT,
  "address" TEXT,
  "land_area" DOUBLE PRECISION,
  "construction_area" DOUBLE PRECISION,
  "total_units" INTEGER NOT NULL DEFAULT 0,
  "total_budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "start_date" TIMESTAMP(3),
  "end_date" TIMESTAMP(3),
  "completion_pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "description" TEXT,
  "image_url" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "investment_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "feasibility_items" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "type" "FeasibilityType" NOT NULL DEFAULT 'MALIYET',
  "category" TEXT NOT NULL,
  "description" TEXT,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "feasibility_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "project_units" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "unit_no" TEXT NOT NULL,
  "type" "UnitType" NOT NULL DEFAULT 'DAIRE_2_1',
  "floor" INTEGER NOT NULL DEFAULT 0,
  "gross_area" DOUBLE PRECISION,
  "net_area" DOUBLE PRECISION,
  "room_count" TEXT,
  "list_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "UnitStatus" NOT NULL DEFAULT 'BOS',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "project_units_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "unit_sales" (
  "id" TEXT NOT NULL,
  "unit_id" TEXT NOT NULL,
  "customer_id" TEXT,
  "buyer_name" TEXT NOT NULL,
  "buyer_phone" TEXT,
  "buyer_email" TEXT,
  "sale_price" DOUBLE PRECISION NOT NULL,
  "sale_date" TIMESTAMP(3) NOT NULL,
  "contract_no" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "unit_sales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "payment_plans" (
  "id" TEXT NOT NULL,
  "sale_id" TEXT NOT NULL,
  "type" "PaymentType" NOT NULL DEFAULT 'TAKSIT',
  "installment_no" INTEGER NOT NULL DEFAULT 1,
  "due_date" TIMESTAMP(3) NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "paid_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "paid_date" TIMESTAMP(3),
  "status" "PaymentStatus" NOT NULL DEFAULT 'BEKLENIYOR',
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payment_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cash_flow_entries" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "type" "CashFlowType" NOT NULL DEFAULT 'GIRIS',
  "category" TEXT NOT NULL,
  "description" TEXT,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "entry_date" TIMESTAMP(3) NOT NULL,
  "is_projection" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cash_flow_entries_pkey" PRIMARY KEY ("id")
);

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "unit_sales_unit_id_key" ON "unit_sales"("unit_id");

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "feasibility_items" ADD CONSTRAINT "feasibility_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "investment_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "project_units" ADD CONSTRAINT "project_units_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "investment_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "unit_sales" ADD CONSTRAINT "unit_sales_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "project_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "unit_sales" ADD CONSTRAINT "unit_sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "unit_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "cash_flow_entries" ADD CONSTRAINT "cash_flow_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "investment_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
