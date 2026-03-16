-- Migration: Worker ↔ Employee bağlantısı (Ana firma İK entegrasyonu)
-- Workers tablosuna employee_id kolonu ekle  

-- 1) employee_id kolonu ekle
ALTER TABLE workers ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- 2) Unique constraint ekle (bir employee sadece bir worker'a bağlı)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'workers_employee_id_key'
  ) THEN
    CREATE UNIQUE INDEX workers_employee_id_key ON workers(employee_id);
  END IF;
END $$;

-- 3) Foreign key ekle (employees tablosuna referans)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'workers_employee_id_fkey'
  ) THEN
    ALTER TABLE workers ADD CONSTRAINT workers_employee_id_fkey 
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
END $$;
