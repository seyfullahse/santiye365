-- =============================================
-- Maskot AI Asistan Migration
-- Şantiye360 - Faz 1
-- =============================================

-- 1) Enum tipleri
DO $$ BEGIN
  CREATE TYPE "MascotRole" AS ENUM ('MIMAR', 'MUHENDIS', 'KOORDINATOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "MascotGender" AS ENUM ('KADIN', 'ERKEK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) mascots tablosu
CREATE TABLE IF NOT EXISTS "mascots" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "name"           TEXT NOT NULL,
  "role"           "MascotRole" NOT NULL DEFAULT 'MIMAR',
  "gender"         "MascotGender" NOT NULL DEFAULT 'KADIN',
  "personality"    TEXT NOT NULL,
  "avatar_type"    TEXT NOT NULL DEFAULT 'svg',
  "avatar_data"    TEXT,
  "emoji"          TEXT NOT NULL DEFAULT '👩‍🎨',
  "primary_color"  TEXT NOT NULL DEFAULT '#8B5CF6',
  "voice_lang"     TEXT NOT NULL DEFAULT 'tr-TR',
  "voice_pitch"    DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "voice_rate"     DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  "is_active"      BOOLEAN NOT NULL DEFAULT true,
  "is_default"     BOOLEAN NOT NULL DEFAULT false,
  "sort_order"     INTEGER NOT NULL DEFAULT 0,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mascots_pkey" PRIMARY KEY ("id")
);

-- 3) mascot_prompt_contexts tablosu
CREATE TABLE IF NOT EXISTS "mascot_prompt_contexts" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "key"         TEXT NOT NULL,
  "label"       TEXT NOT NULL,
  "content"     TEXT NOT NULL,
  "is_active"   BOOLEAN NOT NULL DEFAULT true,
  "sort_order"  INTEGER NOT NULL DEFAULT 0,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mascot_prompt_contexts_pkey" PRIMARY KEY ("id")
);

-- key unique index
CREATE UNIQUE INDEX IF NOT EXISTS "mascot_prompt_contexts_key_key" ON "mascot_prompt_contexts"("key");

-- 4) mascot_conversations tablosu
CREATE TABLE IF NOT EXISTS "mascot_conversations" (
  "id"            TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "mascot_id"     TEXT NOT NULL,
  "user_message"  TEXT NOT NULL,
  "ai_response"   TEXT NOT NULL,
  "source"        TEXT NOT NULL DEFAULT 'tv',
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mascot_conversations_pkey" PRIMARY KEY ("id")
);

-- FK: mascot_conversations → mascots
DO $$ BEGIN
  ALTER TABLE "mascot_conversations"
    ADD CONSTRAINT "mascot_conversations_mascot_id_fkey"
    FOREIGN KEY ("mascot_id") REFERENCES "mascots"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index on mascot_id
CREATE INDEX IF NOT EXISTS "mascot_conversations_mascot_id_idx" ON "mascot_conversations"("mascot_id");

-- 5) Varsayılan 3 karakter
INSERT INTO "mascots" ("id", "name", "role", "gender", "personality", "emoji", "primary_color", "voice_pitch", "voice_rate", "is_default", "sort_order")
VALUES
  ('mascot-mimar-01', 'Ayşe Mimar', 'MIMAR', 'KADIN',
   'Zarif ve detaycı bir mimarsın. Estetik konularda hassassın. "Bu detay olmaz!" demeyi seversin. Tasarım ve güzellik senin işin. Şantiyede en düzenli, en titiz sensin. Bazen işçilere "Bu renk uyumu yanlış!" diye takılırsın.',
   '👩‍🎨', '#8B5CF6', 1.1, 0.9, true, 0),
  ('mascot-muhendis-01', 'Mehmet Mühendis', 'MUHENDIS', 'ERKEK',
   'Analitik ve teknik düşünen bir mühendissin. "Hesap yapmadan adım atmam" dersin. Statik, betonarme ve yapısal konularda uzmansın. Ama aynı zamanda esprili ve samimilerin. Bazen teknik terimlerle espri yaparsın.',
   '👨‍🔧', '#3B82F6', 0.9, 1.0, false, 1),
  ('mascot-koordinator-01', 'Zeynep Koordinatör', 'KOORDINATOR', 'KADIN',
   'Enerjik ve organize bir koordinatörsün. "Hadi ekip, toplantı zamanı!" demeyi seversin. Süre yönetimi, ekip koordinasyonu ve planlama konusunda uzmansın. Herkesi motive edersin. Bazen saat başı "Neredeyiz?" diye sorar gibi yaparsın.',
   '👩‍💼', '#F59E0B', 1.2, 1.1, false, 2)
ON CONFLICT ("id") DO NOTHING;

-- 6) Varsayılan prompt bağlamları
INSERT INTO "mascot_prompt_contexts" ("id", "key", "label", "content", "sort_order")
VALUES
  ('prompt-proje', 'proje_bilgisi', 'Proje Bilgisi', 'Bu bir inşaat projesidir. Detayları ayarlardan güncelleyebilirsiniz.', 0),
  ('prompt-ekip', 'ekip_bilgisi', 'Ekip Bilgisi', 'Şantiyede mimar, mühendis, koordinatör ve işçiler birlikte çalışıyor.', 1),
  ('prompt-kurallar', 'kurallar', 'Özel Kurallar', 'Motivasyonu yüksek tut. Eğlenceli ol. Şantiye jargonu kullan.', 2)
ON CONFLICT ("key") DO NOTHING;

SELECT 'Maskot migration completed successfully ✅' AS status;
