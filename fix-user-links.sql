-- ═══════════════════════════════════════════════════════════
-- Şantiye360 — Kullanıcı-Employee-Worker Bağlantı Fix
-- Tarih: 2025-07-11
-- ═══════════════════════════════════════════════════════════

-- Hangi takım olduğunu bul (varsayılan olarak ilk aktif takım)
-- Mevcut takım: cmltwt8bq001501lb5rdza7dc (çoğu worker bu takımda)

-- ── 1. Bağlanmamış user'ları employee'lerine bağla ─────────

-- admin-001 (Seyfullah SEPET) → Employee: cmm1yt99q000c01kccl0dh7na (Seyfullah SEPET)
UPDATE users
SET employee_id = 'cmm1yt99q000c01kccl0dh7na'
WHERE id = 'admin-001' AND employee_id IS NULL;

-- Zafer Şener → Employee: cmm1yt8o1000601kcnvcavgr7 (Zafer Şener)
UPDATE users
SET employee_id = 'cmm1yt8o1000601kcnvcavgr7'
WHERE id = 'cmlumvll6000101nyioaw90z4' AND employee_id IS NULL;


-- ── 2. Employee'si olan ama worker'ı olmayan user'lar için worker oluştur ──

-- Cem Öz (employee_id: cmm1yt9gf000e01kch0ffov52) → Worker yok, oluştur
INSERT INTO workers (id, team_id, employee_id, first_name, last_name, role, is_active, created_at, updated_at)
SELECT
  'w-cem-oz',
  'cmltwt8bq001501lb5rdza7dc',
  'cmm1yt9gf000e01kch0ffov52',
  'Cem',
  'Öz',
  'Mühendis',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM workers WHERE employee_id = 'cmm1yt9gf000e01kch0ffov52'
);

-- admin-001 (Seyfullah SEPET) — zaten worker var (cmmnkwdtl000201qivl0k3pxq), kontrol
-- (Employee: cmm1yt99q000c01kccl0dh7na, bu employee_id zaten worker'da bağlı ✅)

-- Zafer Şener (employee_id: cmm1yt8o1000601kcnvcavgr7) — worker var (cmmnkwdun000901qi...)
-- Worker tablosunda Zafer Şener var mı kontrol et:
INSERT INTO workers (id, team_id, employee_id, first_name, last_name, role, is_active, created_at, updated_at)
SELECT
  'w-zafer-sener',
  'cmltwt8bq001501lb5rdza7dc',
  'cmm1yt8o1000601kcnvcavgr7',
  'Zafer',
  'Şener',
  'Proje Müdürü',
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM workers WHERE employee_id = 'cmm1yt8o1000601kcnvcavgr7'
);


-- ── 3. Doğrulama ──────────────────────────────────────────

-- Kontrol: User → Employee → Worker zinciri
SELECT
  u.name, u.email, u.role,
  u.employee_id IS NOT NULL as has_employee,
  w.id as worker_id,
  w.first_name as w_name
FROM users u
LEFT JOIN workers w ON w.employee_id = u.employee_id
ORDER BY u.name;
