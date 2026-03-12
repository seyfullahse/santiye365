-- Çalışan İndirimleri tablosu
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
