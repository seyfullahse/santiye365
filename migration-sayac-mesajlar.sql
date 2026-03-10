-- ═══════════════════════════════════════════════════════════
-- Sayaç Mesajları Tablosu - Canlı Sunucu Migration
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS "sayac_messages" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "text" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'Zap',
    "type" TEXT NOT NULL DEFAULT 'active',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sayac_messages_pkey" PRIMARY KEY ("id")
);
