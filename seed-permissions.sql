-- ═══════════════════════════════════════════════════════════
-- Şantiye360 — İzin Sistemi Seed Data (SQL)
-- Tarih: 2025-07-11
-- ═══════════════════════════════════════════════════════════

-- ── 1. İZİN TANIMLARI (permissions) ───────────────────────

INSERT INTO permissions (id, module, action, description, created_at) VALUES
  -- Projeler
  ('perm_projeler_read',     'projeler',    'read',    'Projeleri görüntüleme',              NOW()),
  ('perm_projeler_create',   'projeler',    'create',  'Yeni proje oluşturma',               NOW()),
  ('perm_projeler_update',   'projeler',    'update',  'Proje düzenleme',                    NOW()),
  ('perm_projeler_delete',   'projeler',    'delete',  'Proje silme',                        NOW()),
  -- Puantaj
  ('perm_puantaj_read',      'puantaj',     'read',    'Puantaj kayıtlarını görüntüleme',    NOW()),
  ('perm_puantaj_write',     'puantaj',     'write',   'Puantaj girişi yapma',               NOW()),
  ('perm_puantaj_delete',    'puantaj',     'delete',  'Puantaj kaydı silme',                NOW()),
  -- Hakediş
  ('perm_hakedis_read',      'hakedis',     'read',    'Hakediş verilerini görüntüleme',     NOW()),
  ('perm_hakedis_write',     'hakedis',     'write',   'Hakediş verisi girme/düzenleme',     NOW()),
  ('perm_hakedis_delete',    'hakedis',     'delete',  'Hakediş kaydı silme',                NOW()),
  -- İK
  ('perm_ik_read',           'ik',          'read',    'İK verilerini görüntüleme',          NOW()),
  ('perm_ik_write',          'ik',          'write',   'İK verisi girme/düzenleme',          NOW()),
  ('perm_ik_delete',         'ik',          'delete',  'İK kaydı silme',                     NOW()),
  -- İzin
  ('perm_izin_request',      'izin',        'request', 'İzin talebi oluşturma',              NOW()),
  ('perm_izin_approve',      'izin',        'approve', 'İzin talebi onaylama',               NOW()),
  -- İSG
  ('perm_isg_read',          'isg',         'read',    'İSG verilerini görüntüleme',         NOW()),
  ('perm_isg_write',         'isg',         'write',   'İSG verisi girme/düzenleme',         NOW()),
  -- Muhasebe
  ('perm_muhasebe_read',     'muhasebe',    'read',    'Muhasebe verilerini görüntüleme',    NOW()),
  ('perm_muhasebe_write',    'muhasebe',    'write',   'Muhasebe verisi girme/düzenleme',    NOW()),
  -- Duyurular
  ('perm_duyurular_read',    'duyurular',   'read',    'Duyuruları görüntüleme',             NOW()),
  ('perm_duyurular_create',  'duyurular',   'create',  'Duyuru oluşturma',                   NOW()),
  ('perm_duyurular_delete',  'duyurular',   'delete',  'Duyuru silme',                       NOW()),
  -- İndirimler
  ('perm_indirimler_read',   'indirimler',  'read',    'İndirim listesini görüntüleme',      NOW()),
  -- Şirketler
  ('perm_sirketler_read',    'sirketler',   'read',    'Şirket bilgilerini görüntüleme',     NOW()),
  ('perm_sirketler_write',   'sirketler',   'write',   'Şirket bilgisi düzenleme',           NOW()),
  -- Kullanıcılar
  ('perm_kullanicilar_read', 'kullanicilar','read',    'Kullanıcıları görüntüleme',          NOW()),
  ('perm_kullanicilar_write','kullanicilar','write',   'Kullanıcı oluşturma/düzenleme',      NOW()),
  ('perm_kullanicilar_delete','kullanicilar','delete', 'Kullanıcı silme',                    NOW()),
  -- CRM
  ('perm_crm_read',          'crm',         'read',    'CRM verilerini görüntüleme',         NOW()),
  ('perm_crm_write',         'crm',         'write',   'CRM verisi girme/düzenleme',         NOW()),
  -- Taşeron
  ('perm_taseron_read',      'taseron',     'read',    'Taşeron verilerini görüntüleme',     NOW()),
  ('perm_taseron_write',     'taseron',     'write',   'Taşeron verisi girme/düzenleme',     NOW()),
  -- Toplantı
  ('perm_toplanti_read',     'toplanti',    'read',    'Toplantı tutanaklarını görüntüleme',  NOW()),
  ('perm_toplanti_write',    'toplanti',    'write',   'Toplantı tutanağı oluşturma/düzenleme', NOW()),
  -- Sunum
  ('perm_sunum_read',        'sunum',       'read',    'Sunumları görüntüleme',              NOW()),
  ('perm_sunum_write',       'sunum',       'write',   'Sunum oluşturma/düzenleme',          NOW()),
  -- Teklif & İhale
  ('perm_teklif_read',       'teklif',      'read',    'Teklif/ihale verilerini görüntüleme', NOW()),
  ('perm_teklif_write',      'teklif',      'write',   'Teklif/ihale verisi girme/düzenleme', NOW()),
  -- Yatırım & GYO
  ('perm_yatirim_read',      'yatirim',     'read',    'Yatırım verilerini görüntüleme',     NOW()),
  ('perm_yatirim_write',     'yatirim',     'write',   'Yatırım verisi girme/düzenleme',     NOW()),
  -- Organizasyon
  ('perm_organizasyon_read', 'organizasyon','read',    'Organizasyon şemasını görüntüleme',   NOW()),
  ('perm_organizasyon_write','organizasyon','write',   'Organizasyon düzenleme',              NOW()),
  -- Maskot AI
  ('perm_maskot_read',       'maskot',      'read',    'Maskot AI kullanma',                  NOW()),
  ('perm_maskot_write',      'maskot',      'write',   'Maskot AI ayarlarını düzenleme',      NOW()),
  -- Ayarlar
  ('perm_ayarlar_read',      'ayarlar',     'read',    'Ayarları görüntüleme',               NOW()),
  ('perm_ayarlar_write',     'ayarlar',     'write',   'Ayarları düzenleme',                 NOW()),
  -- Yönetim Paneli
  ('perm_yonetim_read',      'yonetim-paneli','read',  'Yönetim panelini görüntüleme',       NOW())
ON CONFLICT (module, action) DO UPDATE SET description = EXCLUDED.description;


-- ── 2. ROL İZİNLERİ (role_permissions) ────────────────────

-- ADMIN — Tüm izinler GLOBAL
INSERT INTO role_permissions (id, role, permission_id, scope, created_at)
SELECT 'rp_admin_' || p.id, 'ADMIN', p.id, 'GLOBAL', NOW()
FROM permissions p
ON CONFLICT (role, permission_id) DO UPDATE SET scope = EXCLUDED.scope;

-- PROJECT_ADMIN
INSERT INTO role_permissions (id, role, permission_id, scope, created_at) VALUES
  ('rp_pa_proj_read',    'PROJECT_ADMIN', 'perm_projeler_read',      'PROJECT', NOW()),
  ('rp_pa_proj_update',  'PROJECT_ADMIN', 'perm_projeler_update',    'PROJECT', NOW()),
  ('rp_pa_puan_read',    'PROJECT_ADMIN', 'perm_puantaj_read',       'PROJECT', NOW()),
  ('rp_pa_puan_write',   'PROJECT_ADMIN', 'perm_puantaj_write',      'PROJECT', NOW()),
  ('rp_pa_hak_read',     'PROJECT_ADMIN', 'perm_hakedis_read',       'PROJECT', NOW()),
  ('rp_pa_hak_write',    'PROJECT_ADMIN', 'perm_hakedis_write',      'PROJECT', NOW()),
  ('rp_pa_ik_read',      'PROJECT_ADMIN', 'perm_ik_read',            'PROJECT', NOW()),
  ('rp_pa_ik_write',     'PROJECT_ADMIN', 'perm_ik_write',           'PROJECT', NOW()),
  ('rp_pa_izin_req',     'PROJECT_ADMIN', 'perm_izin_request',       'GLOBAL',  NOW()),
  ('rp_pa_izin_app',     'PROJECT_ADMIN', 'perm_izin_approve',       'PROJECT', NOW()),
  ('rp_pa_isg_read',     'PROJECT_ADMIN', 'perm_isg_read',           'PROJECT', NOW()),
  ('rp_pa_isg_write',    'PROJECT_ADMIN', 'perm_isg_write',          'PROJECT', NOW()),
  ('rp_pa_sirk_read',    'PROJECT_ADMIN', 'perm_sirketler_read',     'GLOBAL',  NOW()),
  ('rp_pa_tas_read',     'PROJECT_ADMIN', 'perm_taseron_read',       'PROJECT', NOW()),
  ('rp_pa_tas_write',    'PROJECT_ADMIN', 'perm_taseron_write',      'PROJECT', NOW()),
  ('rp_pa_top_read',     'PROJECT_ADMIN', 'perm_toplanti_read',      'PROJECT', NOW()),
  ('rp_pa_top_write',    'PROJECT_ADMIN', 'perm_toplanti_write',     'PROJECT', NOW()),
  ('rp_pa_duy_read',     'PROJECT_ADMIN', 'perm_duyurular_read',     'GLOBAL',  NOW()),
  ('rp_pa_ind_read',     'PROJECT_ADMIN', 'perm_indirimler_read',    'GLOBAL',  NOW()),
  ('rp_pa_org_read',     'PROJECT_ADMIN', 'perm_organizasyon_read',  'GLOBAL',  NOW()),
  ('rp_pa_ayar_read',    'PROJECT_ADMIN', 'perm_ayarlar_read',       'SELF',    NOW())
ON CONFLICT (role, permission_id) DO UPDATE SET scope = EXCLUDED.scope;

-- MANAGER
INSERT INTO role_permissions (id, role, permission_id, scope, created_at) VALUES
  ('rp_mg_proj_read',    'MANAGER', 'perm_projeler_read',      'PROJECT', NOW()),
  ('rp_mg_puan_read',    'MANAGER', 'perm_puantaj_read',       'PROJECT', NOW()),
  ('rp_mg_puan_write',   'MANAGER', 'perm_puantaj_write',      'PROJECT', NOW()),
  ('rp_mg_hak_read',     'MANAGER', 'perm_hakedis_read',       'PROJECT', NOW()),
  ('rp_mg_ik_read',      'MANAGER', 'perm_ik_read',            'PROJECT', NOW()),
  ('rp_mg_izin_req',     'MANAGER', 'perm_izin_request',       'GLOBAL',  NOW()),
  ('rp_mg_izin_app',     'MANAGER', 'perm_izin_approve',       'GLOBAL',  NOW()),
  ('rp_mg_isg_read',     'MANAGER', 'perm_isg_read',           'PROJECT', NOW()),
  ('rp_mg_isg_write',    'MANAGER', 'perm_isg_write',          'PROJECT', NOW()),
  ('rp_mg_sirk_read',    'MANAGER', 'perm_sirketler_read',     'GLOBAL',  NOW()),
  ('rp_mg_duy_read',     'MANAGER', 'perm_duyurular_read',     'GLOBAL',  NOW()),
  ('rp_mg_ind_read',     'MANAGER', 'perm_indirimler_read',    'GLOBAL',  NOW()),
  ('rp_mg_org_read',     'MANAGER', 'perm_organizasyon_read',  'GLOBAL',  NOW()),
  ('rp_mg_top_read',     'MANAGER', 'perm_toplanti_read',      'PROJECT', NOW()),
  ('rp_mg_top_write',    'MANAGER', 'perm_toplanti_write',     'PROJECT', NOW()),
  ('rp_mg_ayar_read',    'MANAGER', 'perm_ayarlar_read',       'SELF',    NOW())
ON CONFLICT (role, permission_id) DO UPDATE SET scope = EXCLUDED.scope;

-- MUHASEBE
INSERT INTO role_permissions (id, role, permission_id, scope, created_at) VALUES
  ('rp_mh_puan_read',    'MUHASEBE', 'perm_puantaj_read',      'GLOBAL',  NOW()),
  ('rp_mh_hak_read',     'MUHASEBE', 'perm_hakedis_read',      'GLOBAL',  NOW()),
  ('rp_mh_hak_write',    'MUHASEBE', 'perm_hakedis_write',     'GLOBAL',  NOW()),
  ('rp_mh_muh_read',     'MUHASEBE', 'perm_muhasebe_read',     'GLOBAL',  NOW()),
  ('rp_mh_muh_write',    'MUHASEBE', 'perm_muhasebe_write',    'GLOBAL',  NOW()),
  ('rp_mh_tas_read',     'MUHASEBE', 'perm_taseron_read',      'GLOBAL',  NOW()),
  ('rp_mh_sirk_read',    'MUHASEBE', 'perm_sirketler_read',    'GLOBAL',  NOW()),
  ('rp_mh_duy_read',     'MUHASEBE', 'perm_duyurular_read',    'GLOBAL',  NOW()),
  ('rp_mh_ind_read',     'MUHASEBE', 'perm_indirimler_read',   'GLOBAL',  NOW()),
  ('rp_mh_izin_req',     'MUHASEBE', 'perm_izin_request',      'GLOBAL',  NOW()),
  ('rp_mh_ayar_read',    'MUHASEBE', 'perm_ayarlar_read',      'SELF',    NOW())
ON CONFLICT (role, permission_id) DO UPDATE SET scope = EXCLUDED.scope;

-- USER
INSERT INTO role_permissions (id, role, permission_id, scope, created_at) VALUES
  ('rp_us_proj_read',    'USER', 'perm_projeler_read',        'PROJECT', NOW()),
  ('rp_us_puan_read',    'USER', 'perm_puantaj_read',         'SELF',    NOW()),
  ('rp_us_ik_read',      'USER', 'perm_ik_read',              'SELF',    NOW()),
  ('rp_us_izin_req',     'USER', 'perm_izin_request',         'GLOBAL',  NOW()),
  ('rp_us_isg_read',     'USER', 'perm_isg_read',             'SELF',    NOW()),
  ('rp_us_sirk_read',    'USER', 'perm_sirketler_read',       'GLOBAL',  NOW()),
  ('rp_us_duy_read',     'USER', 'perm_duyurular_read',       'GLOBAL',  NOW()),
  ('rp_us_ind_read',     'USER', 'perm_indirimler_read',      'GLOBAL',  NOW()),
  ('rp_us_org_read',     'USER', 'perm_organizasyon_read',    'GLOBAL',  NOW()),
  ('rp_us_ayar_read',    'USER', 'perm_ayarlar_read',         'SELF',    NOW())
ON CONFLICT (role, permission_id) DO UPDATE SET scope = EXCLUDED.scope;

-- VIEWER
INSERT INTO role_permissions (id, role, permission_id, scope, created_at) VALUES
  ('rp_vw_proj_read',    'VIEWER', 'perm_projeler_read',      'PROJECT', NOW()),
  ('rp_vw_duy_read',     'VIEWER', 'perm_duyurular_read',     'GLOBAL',  NOW()),
  ('rp_vw_ind_read',     'VIEWER', 'perm_indirimler_read',    'GLOBAL',  NOW()),
  ('rp_vw_sirk_read',    'VIEWER', 'perm_sirketler_read',     'GLOBAL',  NOW()),
  ('rp_vw_org_read',     'VIEWER', 'perm_organizasyon_read',  'GLOBAL',  NOW()),
  ('rp_vw_ayar_read',    'VIEWER', 'perm_ayarlar_read',       'SELF',    NOW())
ON CONFLICT (role, permission_id) DO UPDATE SET scope = EXCLUDED.scope;


-- ── 3. ONAY ZİNCİRLERİ (approval_chains + approval_steps) ─

-- İzin Talebi Onayı
INSERT INTO approval_chains (id, name, module, is_active, sla_hours, created_at, updated_at)
VALUES ('chain_leave', 'İzin Talebi Onayı', 'leave', true, 48, NOW(), NOW())
ON CONFLICT (module) DO UPDATE SET name = EXCLUDED.name, sla_hours = EXCLUDED.sla_hours;

INSERT INTO approval_steps (id, chain_id, step_order, name, approver_type, approver_role, auto_assign, sla_hours, created_at) VALUES
  ('step_leave_1', 'chain_leave', 1, 'Direkt Yönetici',   'MANAGER',    NULL,            true,  24, NOW()),
  ('step_leave_2', 'chain_leave', 2, 'Departman Müdürü',  'DEPARTMENT', NULL,            true,  24, NOW()),
  ('step_leave_3', 'chain_leave', 3, 'İK Onayı',          'ROLE',       'ADMIN',         false, 48, NOW())
ON CONFLICT (chain_id, step_order) DO UPDATE SET name = EXCLUDED.name, approver_type = EXCLUDED.approver_type;

-- Hakediş Onayı
INSERT INTO approval_chains (id, name, module, is_active, sla_hours, created_at, updated_at)
VALUES ('chain_hakedis', 'Hakediş Onayı', 'hakedis', true, 72, NOW(), NOW())
ON CONFLICT (module) DO UPDATE SET name = EXCLUDED.name, sla_hours = EXCLUDED.sla_hours;

INSERT INTO approval_steps (id, chain_id, step_order, name, approver_type, approver_role, auto_assign, sla_hours, created_at) VALUES
  ('step_hak_1', 'chain_hakedis', 1, 'Proje Müdürü',  'ROLE', 'PROJECT_ADMIN', false, 48, NOW()),
  ('step_hak_2', 'chain_hakedis', 2, 'Mali İşler',    'ROLE', 'MUHASEBE',      false, 48, NOW()),
  ('step_hak_3', 'chain_hakedis', 3, 'Genel Müdür',   'ROLE', 'ADMIN',         false, 72, NOW())
ON CONFLICT (chain_id, step_order) DO UPDATE SET name = EXCLUDED.name, approver_type = EXCLUDED.approver_type;

-- Malzeme Talebi Onayı
INSERT INTO approval_chains (id, name, module, is_active, sla_hours, created_at, updated_at)
VALUES ('chain_malzeme', 'Malzeme Talebi Onayı', 'malzeme', true, 24, NOW(), NOW())
ON CONFLICT (module) DO UPDATE SET name = EXCLUDED.name, sla_hours = EXCLUDED.sla_hours;

INSERT INTO approval_steps (id, chain_id, step_order, name, approver_type, approver_role, auto_assign, sla_hours, created_at) VALUES
  ('step_malz_1', 'chain_malzeme', 1, 'Şef Onayı',            'ROLE', 'MANAGER',       false, 12, NOW()),
  ('step_malz_2', 'chain_malzeme', 2, 'Proje Müdürü Onayı',   'ROLE', 'PROJECT_ADMIN', false, 24, NOW())
ON CONFLICT (chain_id, step_order) DO UPDATE SET name = EXCLUDED.name, approver_type = EXCLUDED.approver_type;

-- Puantaj Onayı
INSERT INTO approval_chains (id, name, module, is_active, sla_hours, created_at, updated_at)
VALUES ('chain_puantaj', 'Puantaj Onayı', 'puantaj', true, 24, NOW(), NOW())
ON CONFLICT (module) DO UPDATE SET name = EXCLUDED.name, sla_hours = EXCLUDED.sla_hours;

INSERT INTO approval_steps (id, chain_id, step_order, name, approver_type, approver_role, auto_assign, sla_hours, created_at) VALUES
  ('step_puan_1', 'chain_puantaj', 1, 'Proje Müdürü Onayı', 'ROLE', 'PROJECT_ADMIN', true, 24, NOW())
ON CONFLICT (chain_id, step_order) DO UPDATE SET name = EXCLUDED.name, approver_type = EXCLUDED.approver_type;


-- ═════════════════════════════════════════════════════════
-- TAMAMLANDI — 49 izin, 6 rol eşleştirmesi, 4 onay zinciri
-- ═════════════════════════════════════════════════════════
