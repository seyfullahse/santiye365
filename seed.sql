INSERT INTO disciplines (id, name) VALUES
  (gen_random_uuid(), 'Mimari'),
  (gen_random_uuid(), 'Statik'),
  (gen_random_uuid(), 'Mekanik'),
  (gen_random_uuid(), 'Elektrik'),
  (gen_random_uuid(), 'Altyapi'),
  (gen_random_uuid(), 'Mobilya')
ON CONFLICT (name) DO NOTHING;

INSERT INTO projects (id, name, client, status, start_date, end_date, updated_at) VALUES
  (gen_random_uuid(), 'Demo Proje', 'Test Musteri', 'ACTIVE', '2026-01-01', '2026-12-31', CURRENT_TIMESTAMP);

INSERT INTO users (id, email, name, password, role, updated_at) VALUES
  (gen_random_uuid(), 'admin@santiye360.com', 'Admin', '$2b$10$NUYbi9nyg2755.zEmt9AseXJWGAfRehcNimEeY9wcztj3mdI6TA3C', 'ADMIN', CURRENT_TIMESTAMP)
ON CONFLICT (email) DO NOTHING;
