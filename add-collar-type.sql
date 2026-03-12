DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CollarType') THEN
    CREATE TYPE "CollarType" AS ENUM ('WHITE', 'BLUE');
  END IF;
END $$;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS collar_type "CollarType" NOT NULL DEFAULT 'BLUE';
