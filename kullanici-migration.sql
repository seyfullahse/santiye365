-- Kullanıcı Yönetimi Migration
-- User tablosu genişletme + UserRole enum güncelleme

-- 1) UserRole enum'a yeni değerler ekle
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MANAGER';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'VIEWER';

-- 2) Users tablosuna yeni kolonlar ekle
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "employee_id" TEXT;

-- 3) Employee bağlantısı: unique constraint + FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_employee_id_key'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_key" UNIQUE ("employee_id");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_employee_id_fkey'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_fkey" 
      FOREIGN KEY ("employee_id") REFERENCES "employees"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 4) Mevcut ADMIN kullanıcısını SUPER_ADMIN yap (ilk admin)
UPDATE "users" SET "role" = 'SUPER_ADMIN' WHERE "role" = 'ADMIN' AND "id" = (
  SELECT "id" FROM "users" WHERE "role" = 'ADMIN' ORDER BY "created_at" ASC LIMIT 1
);
