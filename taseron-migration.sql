-- Taşeron Yönetimi Migration
-- Yeni alanlar companies tablosuna ekleniyor + yeni tablolar oluşturuluyor

-- Companies tablosuna yeni alanlar ekle
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_office TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_no TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS specialization TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS rating DOUBLE PRECISION;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- ENUMs oluştur (yoksa)
DO $$ BEGIN
  CREATE TYPE "TaseronKesintiType" AS ENUM ('CEZAI', 'SGK', 'VERGI', 'GECIKME', 'HASAR', 'DIGER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaseronKesintiStatus" AS ENUM ('BEKLEMEDE', 'UYGULANDI', 'IPTAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaseronTeminatType" AS ENUM ('KESIN_TEMINAT', 'AVANS_TEMINATI', 'EK_TEMINAT', 'NAKIT_TEMINAT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaseronTeminatStatus" AS ENUM ('AKTIF', 'IADE_EDILDI', 'IRAD_KAYDEDILDI', 'SURESI_DOLDU');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaseronEvrakType" AS ENUM ('SGK_BORCU_YOKTUR', 'VERGI_BORCU_YOKTUR', 'ISG_BELGESI', 'SIGORTA_POLICESI', 'IMZA_SIRKULERI', 'TICARET_SICIL', 'FAALIYET_BELGESI', 'YETKI_BELGESI', 'DIGER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TaseronEvrakStatus" AS ENUM ('GECERLI', 'SURESI_DOLDU', 'SURESI_YAKLASTI', 'BEKLEMEDE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- TaseronPuantaj tablosu
CREATE TABLE IF NOT EXISTS taseron_puantajlar (
  id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  contract_id TEXT,
  date TIMESTAMP(3) NOT NULL,
  toplam_isci INTEGER NOT NULL DEFAULT 0,
  toplam_mesai DOUBLE PRECISION NOT NULL DEFAULT 0,
  toplam_devamsiz INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_by_id TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT taseron_puantajlar_pkey PRIMARY KEY (id),
  CONSTRAINT taseron_puantajlar_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT taseron_puantajlar_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES hakedis_contracts(id) ON DELETE SET NULL,
  CONSTRAINT taseron_puantajlar_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS taseron_puantajlar_company_id_date_key ON taseron_puantajlar(company_id, date);

-- TaseronPuantajKalemi tablosu
CREATE TABLE IF NOT EXISTS taseron_puantaj_kalemleri (
  id TEXT NOT NULL,
  puantaj_id TEXT NOT NULL,
  pozisyon TEXT NOT NULL,
  sayi INTEGER NOT NULL DEFAULT 0,
  mesai_saat DOUBLE PRECISION NOT NULL DEFAULT 0,
  devamsiz INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  CONSTRAINT taseron_puantaj_kalemleri_pkey PRIMARY KEY (id),
  CONSTRAINT taseron_puantaj_kalemleri_puantaj_id_fkey FOREIGN KEY (puantaj_id) REFERENCES taseron_puantajlar(id) ON DELETE CASCADE
);

-- TaseronPerformans tablosu
CREATE TABLE IF NOT EXISTS taseron_performanslar (
  id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  contract_id TEXT,
  evaluated_by_id TEXT,
  period TEXT NOT NULL,
  kalite_puani DOUBLE PRECISION NOT NULL DEFAULT 5,
  sure_puani DOUBLE PRECISION NOT NULL DEFAULT 5,
  isg_puani DOUBLE PRECISION NOT NULL DEFAULT 5,
  iletisim_puani DOUBLE PRECISION NOT NULL DEFAULT 5,
  malzeme_puani DOUBLE PRECISION NOT NULL DEFAULT 5,
  genel_puan DOUBLE PRECISION NOT NULL DEFAULT 5,
  notes TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT taseron_performanslar_pkey PRIMARY KEY (id),
  CONSTRAINT taseron_performanslar_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT taseron_performanslar_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES hakedis_contracts(id) ON DELETE SET NULL,
  CONSTRAINT taseron_performanslar_evaluated_by_id_fkey FOREIGN KEY (evaluated_by_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS taseron_performanslar_company_contract_period_key ON taseron_performanslar(company_id, contract_id, period);

-- TaseronKesinti tablosu
CREATE TABLE IF NOT EXISTS taseron_kesintiler (
  id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  contract_id TEXT,
  hakedis_id TEXT,
  type "TaseronKesintiType" NOT NULL DEFAULT 'DIGER',
  description TEXT,
  amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  date TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status "TaseronKesintiStatus" NOT NULL DEFAULT 'BEKLEMEDE',
  notes TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT taseron_kesintiler_pkey PRIMARY KEY (id),
  CONSTRAINT taseron_kesintiler_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT taseron_kesintiler_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES hakedis_contracts(id) ON DELETE SET NULL,
  CONSTRAINT taseron_kesintiler_hakedis_id_fkey FOREIGN KEY (hakedis_id) REFERENCES hakedisler(id) ON DELETE SET NULL
);

-- TaseronTeminat tablosu
CREATE TABLE IF NOT EXISTS taseron_teminatlar (
  id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  contract_id TEXT,
  type "TaseronTeminatType" NOT NULL DEFAULT 'KESIN_TEMINAT',
  amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  bank_name TEXT,
  letter_no TEXT,
  start_date TIMESTAMP(3),
  end_date TIMESTAMP(3),
  status "TaseronTeminatStatus" NOT NULL DEFAULT 'AKTIF',
  notes TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT taseron_teminatlar_pkey PRIMARY KEY (id),
  CONSTRAINT taseron_teminatlar_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT taseron_teminatlar_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES hakedis_contracts(id) ON DELETE SET NULL
);

-- TaseronEvrak tablosu
CREATE TABLE IF NOT EXISTS taseron_evraklar (
  id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  type "TaseronEvrakType" NOT NULL DEFAULT 'DIGER',
  title TEXT NOT NULL,
  description TEXT,
  issue_date TIMESTAMP(3),
  expiry_date TIMESTAMP(3),
  reminder_days INTEGER NOT NULL DEFAULT 30,
  status "TaseronEvrakStatus" NOT NULL DEFAULT 'GECERLI',
  file_url TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT taseron_evraklar_pkey PRIMARY KEY (id),
  CONSTRAINT taseron_evraklar_company_id_fkey FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Mevcut şirketlerin is_active alanını güncelle (NULL olanları)
UPDATE companies SET is_active = true WHERE is_active IS NULL;
UPDATE companies SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE companies SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
