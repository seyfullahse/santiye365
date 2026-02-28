-- ============================================================
-- Şantiye360 - Migration: Missing Tables & Columns
-- Generated from prisma/schema.prisma
-- Run against production PostgreSQL database
-- ============================================================

BEGIN;

-- ════════════════════════════════════════════════════════════
-- 1) NEW ENUM TYPES
-- ════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE "PricingModel" AS ENUM ('AYRINTILI', 'TEKFIYAT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CustomerType" AS ENUM ('COMPANY', 'INDIVIDUAL', 'GOVERNMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CustomerSegment" AS ENUM ('PRIVATE', 'PUBLIC', 'CORPORATE', 'SME');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLACKLISTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OpportunityStage" AS ENUM ('LEAD', 'NEEDS_ANALYSIS', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CommunicationType" AS ENUM ('MEETING', 'PHONE', 'EMAIL', 'VISIT', 'NOTE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AnnouncementPriority" AS ENUM ('NORMAL', 'IMPORTANT', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AnnouncementTarget" AS ENUM ('EVERYONE', 'ROLE_BASED', 'SPECIFIC_USERS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════════
-- 2) ALTER EXISTING TABLES (new columns)
-- ════════════════════════════════════════════════════════════

-- projects: add customer_id column
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "customer_id" TEXT;

-- hakedis: add contract_id column
ALTER TABLE "hakedis" ADD COLUMN IF NOT EXISTS "contract_id" TEXT;

-- ════════════════════════════════════════════════════════════
-- 3) CREATE MISSING TABLES
-- ════════════════════════════════════════════════════════════

-- ─── CRM: MÜŞTERİLER ────────────────────────────────────
CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL DEFAULT 'COMPANY',
    "segment" "CustomerSegment" NOT NULL DEFAULT 'PRIVATE',
    "tax_no" TEXT,
    "tax_office" TEXT,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- ─── CRM: MÜŞTERİ İLETİŞİM KİŞİLERİ ───────────────────
CREATE TABLE IF NOT EXISTS "customer_contacts" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "title" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- ─── CRM: FIRSATLAR (PIPELINE) ───────────────────────────
CREATE TABLE IF NOT EXISTS "opportunities" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stage" "OpportunityStage" NOT NULL DEFAULT 'LEAD',
    "estimated_value" DECIMAL(15, 2),
    "probability" INTEGER NOT NULL DEFAULT 0,
    "expected_close" TIMESTAMP(3),
    "source" TEXT,
    "assigned_to" TEXT,
    "lost_reason" TEXT,
    "won_date" TIMESTAMP(3),
    "lost_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id")
);

-- ─── CRM: İLETİŞİM GEÇMİŞİ ─────────────────────────────
CREATE TABLE IF NOT EXISTS "communication_logs" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "opportunity_id" TEXT,
    "type" "CommunicationType" NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT,
    "contact_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_follow_up" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_logs_pkey" PRIMARY KEY ("id")
);

-- ─── SÖZLEŞME / KEŞİF (HAKEDİŞ MODÜLÜ) ─────────────────
CREATE TABLE IF NOT EXISTS "hakedis_contracts" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "company_id" TEXT,
    "type" "HakedisType" NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "pricing_model" "PricingModel" NOT NULL DEFAULT 'AYRINTILI',
    "contract_no" TEXT,
    "contract_date" TIMESTAMP(3),
    "total_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "advance_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retention_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hakedis_contracts_pkey" PRIMARY KEY ("id")
);

-- ─── KEŞİF KALEMLERİ (POZ LİSTESİ) ──────────────────────
CREATE TABLE IF NOT EXISTS "hakedis_contract_items" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "ana_grup" TEXT,
    "alt_grup" TEXT,
    "is_kalemi_grubu" TEXT,
    "poz_no" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marka" TEXT,
    "sartname" TEXT,
    "malzeme_fiyati" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "iscilik_fiyati" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ggk_fiyati" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "toplam_birim_fiyat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "toplam_tutar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hakedis_contract_items_pkey" PRIMARY KEY ("id")
);

-- ─── ATAŞMAN (Saha Ölçümleri) ────────────────────────────
CREATE TABLE IF NOT EXISTS "atasmanlar" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "hakedis_id" TEXT,
    "atasman_no" TEXT NOT NULL,
    "aciklama" TEXT,
    "kat_bolge" TEXT,
    "tarih" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atasmanlar_pkey" PRIMARY KEY ("id")
);

-- ─── ATAŞMAN KALEMLERİ ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "atasman_kalemleri" (
    "id" TEXT NOT NULL,
    "atasman_id" TEXT NOT NULL,
    "kesif_kalemi_id" TEXT NOT NULL,
    "miktar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aciklama" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atasman_kalemleri_pkey" PRIMARY KEY ("id")
);

-- ─── İHZARAT (Malzeme Ön Ödemesi) ───────────────────────
CREATE TABLE IF NOT EXISTS "ihzaratlar" (
    "id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "hakedis_id" TEXT NOT NULL,
    "ihzarat_no" TEXT NOT NULL,
    "aciklama" TEXT,
    "tarih" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ihzaratlar_pkey" PRIMARY KEY ("id")
);

-- ─── İHZARAT KALEMLERİ ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "ihzarat_kalemleri" (
    "id" TEXT NOT NULL,
    "ihzarat_id" TEXT NOT NULL,
    "kesif_kalemi_id" TEXT NOT NULL,
    "miktar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aciklama" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ihzarat_kalemleri_pkey" PRIMARY KEY ("id")
);

-- ─── DUYURU KATEGORİLERİ ────────────────────────────────
CREATE TABLE IF NOT EXISTS "announcement_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_categories_pkey" PRIMARY KEY ("id")
);

-- ─── DUYURULAR ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "priority" "AnnouncementPriority" NOT NULL DEFAULT 'NORMAL',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "target_type" "AnnouncementTarget" NOT NULL DEFAULT 'EVERYONE',
    "target_roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "author_id" TEXT NOT NULL,
    "publish_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- ─── DUYURU OKUNMA KAYITLARI ─────────────────────────────
CREATE TABLE IF NOT EXISTS "announcement_reads" (
    "id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_reads_pkey" PRIMARY KEY ("id")
);

-- ─── GERİ SAYIM SAYACI ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "countdown_timers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Haftalık Hedef',
    "description" TEXT,
    "target_date" TIMESTAMP(3) NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🏗️',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countdown_timers_pkey" PRIMARY KEY ("id")
);

-- ════════════════════════════════════════════════════════════
-- 4) UNIQUE CONSTRAINTS
-- ════════════════════════════════════════════════════════════

CREATE UNIQUE INDEX IF NOT EXISTS "announcement_categories_name_key" ON "announcement_categories"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "announcement_reads_announcement_id_user_id_key" ON "announcement_reads"("announcement_id", "user_id");

-- ════════════════════════════════════════════════════════════
-- 5) INDEXES
-- ════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS "announcements_publish_date_idx" ON "announcements"("publish_date");
CREATE INDEX IF NOT EXISTS "announcements_category_id_idx" ON "announcements"("category_id");

-- ════════════════════════════════════════════════════════════
-- 6) FOREIGN KEY CONSTRAINTS
-- ════════════════════════════════════════════════════════════

-- projects.customer_id → customers.id (SET NULL)
DO $$ BEGIN
  ALTER TABLE "projects" ADD CONSTRAINT "projects_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- hakedis.contract_id → hakedis_contracts.id (SET NULL)
DO $$ BEGIN
  ALTER TABLE "hakedis" ADD CONSTRAINT "hakedis_contract_id_fkey"
    FOREIGN KEY ("contract_id") REFERENCES "hakedis_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- customer_contacts.customer_id → customers.id (CASCADE)
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- opportunities.customer_id → customers.id (CASCADE)
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- communication_logs.customer_id → customers.id (CASCADE)
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_customer_id_fkey"
  FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- communication_logs.opportunity_id → opportunities.id (SET NULL)
ALTER TABLE "communication_logs" ADD CONSTRAINT "communication_logs_opportunity_id_fkey"
  FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- hakedis_contracts.project_id → projects.id (CASCADE)
ALTER TABLE "hakedis_contracts" ADD CONSTRAINT "hakedis_contracts_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- hakedis_contracts.company_id → companies.id (SET NULL)
ALTER TABLE "hakedis_contracts" ADD CONSTRAINT "hakedis_contracts_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- hakedis_contract_items.contract_id → hakedis_contracts.id (CASCADE)
ALTER TABLE "hakedis_contract_items" ADD CONSTRAINT "hakedis_contract_items_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "hakedis_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- atasmanlar.contract_id → hakedis_contracts.id (CASCADE)
ALTER TABLE "atasmanlar" ADD CONSTRAINT "atasmanlar_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "hakedis_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- atasmanlar.hakedis_id → hakedis.id (SET NULL)
ALTER TABLE "atasmanlar" ADD CONSTRAINT "atasmanlar_hakedis_id_fkey"
  FOREIGN KEY ("hakedis_id") REFERENCES "hakedis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- atasman_kalemleri.atasman_id → atasmanlar.id (CASCADE)
ALTER TABLE "atasman_kalemleri" ADD CONSTRAINT "atasman_kalemleri_atasman_id_fkey"
  FOREIGN KEY ("atasman_id") REFERENCES "atasmanlar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- atasman_kalemleri.kesif_kalemi_id → hakedis_contract_items.id (CASCADE)
ALTER TABLE "atasman_kalemleri" ADD CONSTRAINT "atasman_kalemleri_kesif_kalemi_id_fkey"
  FOREIGN KEY ("kesif_kalemi_id") REFERENCES "hakedis_contract_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ihzaratlar.contract_id → hakedis_contracts.id (CASCADE)
ALTER TABLE "ihzaratlar" ADD CONSTRAINT "ihzaratlar_contract_id_fkey"
  FOREIGN KEY ("contract_id") REFERENCES "hakedis_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ihzaratlar.hakedis_id → hakedis.id (CASCADE)
ALTER TABLE "ihzaratlar" ADD CONSTRAINT "ihzaratlar_hakedis_id_fkey"
  FOREIGN KEY ("hakedis_id") REFERENCES "hakedis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ihzarat_kalemleri.ihzarat_id → ihzaratlar.id (CASCADE)
ALTER TABLE "ihzarat_kalemleri" ADD CONSTRAINT "ihzarat_kalemleri_ihzarat_id_fkey"
  FOREIGN KEY ("ihzarat_id") REFERENCES "ihzaratlar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ihzarat_kalemleri.kesif_kalemi_id → hakedis_contract_items.id (CASCADE)
ALTER TABLE "ihzarat_kalemleri" ADD CONSTRAINT "ihzarat_kalemleri_kesif_kalemi_id_fkey"
  FOREIGN KEY ("kesif_kalemi_id") REFERENCES "hakedis_contract_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- announcement_categories (no FK)

-- announcements.category_id → announcement_categories.id (RESTRICT)
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_category_id_fkey"
  FOREIGN KEY ("category_id") REFERENCES "announcement_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- announcements.author_id → users.id (CASCADE)
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- announcement_reads.announcement_id → announcements.id (CASCADE)
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_fkey"
  FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- announcement_reads.user_id → users.id (CASCADE)
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- countdown_timers.created_by_id → users.id (SET NULL)
ALTER TABLE "countdown_timers" ADD CONSTRAINT "countdown_timers_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
