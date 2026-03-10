-- Sunum overlay alanları migration
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS show_clock BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS ticker_text TEXT;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS ticker_speed INTEGER NOT NULL DEFAULT 30;
ALTER TABLE presentations ADD COLUMN IF NOT EXISTS show_progress BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE presentation_slides ADD COLUMN IF NOT EXISTS caption TEXT;
