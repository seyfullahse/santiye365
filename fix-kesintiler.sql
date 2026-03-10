-- Fix: taseron_kesintiler tablosu (doğru FK referansı ile)
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
  CONSTRAINT taseron_kesintiler_hakedis_id_fkey FOREIGN KEY (hakedis_id) REFERENCES hakedis(id) ON DELETE SET NULL
);
