INSERT INTO users (id, name, email, password, role, created_at, updated_at)
VALUES (gen_random_uuid(), 'Admin', 'admin@santiye360.org', '$2b$10$RAbNQuh2EOkBNny.oHSD2.vGjJisRV/BuuUhWMtgRDSZ5WIRlpCqq', 'ADMIN', NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;
