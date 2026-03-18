import pg from 'pg';
const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:55432/santiye360?schema=public' });

// ========== 1. COLLAR TYPE ATAMA ==========
// Mavi Yaka Departmanlar
const BLUE_DEPARTMENTS = ['Saha İşçi Pozisyonları'];

// Mavi Yaka Pozisyonlar (departman ne olursa olsun)
const BLUE_POSITIONS = [
  'Formen / Ustabaşı', 'Sürveyan',
  'Operatör (Ekskavatör, Vinç, Beton Pompası vb.)',
  'Makine Bakım Teknisyeni',
  'Depo / Ambar Sorumlusu', 'Lojistik Sorumlusu',
  'Kurye', 'Şoför',
];

// 1a. Departmana göre BLUE ata
const blueDepts = await pool.query(
  `SELECT id FROM departments WHERE name = ANY($1)`,
  [BLUE_DEPARTMENTS]
);
const blueDeptIds = blueDepts.rows.map(r => r.id);

if (blueDeptIds.length > 0) {
  const r1 = await pool.query(
    `UPDATE employees SET collar_type = 'BLUE' WHERE department_id = ANY($1) AND status = 'ACTIVE'`,
    [blueDeptIds]
  );
  console.log(`✅ ${r1.rowCount} çalışan departmana göre MAVİ YAKA yapıldı`);
}

// 1b. Pozisyona göre BLUE ata
const bluePos = await pool.query(
  `SELECT id FROM positions WHERE name = ANY($1)`,
  [BLUE_POSITIONS]
);
const bluePosIds = bluePos.rows.map(r => r.id);

if (bluePosIds.length > 0) {
  const r2 = await pool.query(
    `UPDATE employees SET collar_type = 'BLUE' WHERE position_id = ANY($1) AND status = 'ACTIVE'`,
    [bluePosIds]
  );
  console.log(`✅ ${r2.rowCount} çalışan pozisyona göre MAVİ YAKA yapıldı`);
}

// 1c. Geri kalan NULL olanları WHITE yap
const r3 = await pool.query(
  `UPDATE employees SET collar_type = 'WHITE' WHERE collar_type IS NULL AND status = 'ACTIVE'`
);
console.log(`✅ ${r3.rowCount} çalışan BEYAZ YAKA yapıldı`);

// Sonuç
const collarSummary = await pool.query(
  `SELECT collar_type, COUNT(*) as cnt FROM employees WHERE status = 'ACTIVE' GROUP BY collar_type ORDER BY collar_type`
);
console.log('\n📊 Yaka dağılımı:', collarSummary.rows);

// ========== 2. EĞİTİM TANIMLARI VE VARSAYILAN ATAMALAR ==========
// Mevcut eğitim tanımlarını al
const defs = await pool.query(`SELECT id, name FROM training_definitions ORDER BY name`);
const defMap = new Map(defs.rows.map(r => [r.name, r.id]));

// Önce mevcut requirements temizle
await pool.query(`DELETE FROM training_requirements`);
console.log('\n🗑️ Mevcut training_requirements temizlendi');

// Eğitim → Hedef Kitle eşleştirmesi
const requirements = [
  // TÜM PERSONEL (ALL)
  { name: 'Temel İSG Eğitimi', targetType: 'ALL', targetValue: null },
  { name: 'Yangın Güvenliği ve Tahliye Eğitimi', targetType: 'ALL', targetValue: null },
  { name: 'Acil Durum ve İlk Yardım Eğitimi', targetType: 'ALL', targetValue: null },
  { name: 'Genel Oryantasyon Eğitimi', targetType: 'ALL', targetValue: null },
  { name: 'İş Kazası ve Önleme Eğitimi', targetType: 'ALL', targetValue: null },

  // MAVİ YAKA (COLLAR_TYPE = BLUE)
  { name: 'KKD Kullanım Eğitimi', targetType: 'COLLAR_TYPE', targetValue: 'BLUE' },
  { name: 'Yüksekte Çalışma Eğitimi', targetType: 'COLLAR_TYPE', targetValue: 'BLUE' },
  { name: 'Kapalı Alan Çalışma Eğitimi', targetType: 'COLLAR_TYPE', targetValue: 'BLUE' },
  { name: 'Elektrik Güvenliği Eğitimi', targetType: 'COLLAR_TYPE', targetValue: 'BLUE' },
  { name: 'Sıcak İş (Kaynak vb.) Güvenlik Eğitimi', targetType: 'COLLAR_TYPE', targetValue: 'BLUE' },
  { name: 'İskele Kontrol ve Güvenlik Eğitimi', targetType: 'COLLAR_TYPE', targetValue: 'BLUE' },
  { name: 'İşe Özel (İşbaşı) Eğitimi', targetType: 'COLLAR_TYPE', targetValue: 'BLUE' },
  { name: 'İskele Kurulum / Söküm Eğitimi', targetType: 'COLLAR_TYPE', targetValue: 'BLUE' },
  { name: 'Ağır Ekipman Kullanım Eğitimi', targetType: 'COLLAR_TYPE', targetValue: 'BLUE' },

  // BEYAZ YAKA (COLLAR_TYPE = WHITE)
  { name: 'Risk Değerlendirmesi Eğitimi', targetType: 'COLLAR_TYPE', targetValue: 'WHITE' },

  // POZİSYONA ÖZEL - Vinç Operatör
  { name: 'Vinç Operatör Eğitimi', targetType: 'COLLAR_TYPE', targetValue: 'BLUE' },
  // Forklift Operatör
  { name: 'Forklift Operatör Eğitimi', targetType: 'COLLAR_TYPE', targetValue: 'BLUE' },
  // MYK Kalıpçı  
  { name: 'MYK Mesleki Yeterlilik - Kalıpçı', targetType: 'COLLAR_TYPE', targetValue: 'BLUE' },
];

let inserted = 0;
for (const req of requirements) {
  const defId = defMap.get(req.name);
  if (!defId) {
    console.log(`⚠️ Eğitim tanımı bulunamadı: "${req.name}"`);
    continue;
  }
  await pool.query(
    `INSERT INTO training_requirements (id, training_definition_id, target_type, target_value, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, NOW())
     ON CONFLICT (training_definition_id, target_type, target_value) DO NOTHING`,
    [defId, req.targetType, req.targetValue]
  );
  inserted++;
}
console.log(`\n✅ ${inserted} eğitim-hedef ataması oluşturuldu`);

// Sonuç kontrolü
const reqCount = await pool.query(`SELECT target_type, COUNT(*) as cnt FROM training_requirements GROUP BY target_type ORDER BY target_type`);
console.log('\n📊 Eğitim atamaları dağılımı:', reqCount.rows);

// Detaylı liste
const detail = await pool.query(`
  SELECT td.name as egitim, tr.target_type, tr.target_value 
  FROM training_requirements tr 
  JOIN training_definitions td ON td.id = tr.training_definition_id 
  ORDER BY tr.target_type, td.name
`);
console.log('\n📋 Detaylı atamalar:');
for (const r of detail.rows) {
  const label = r.target_type === 'ALL' ? '🌐 Tüm Personel' 
    : r.target_value === 'BLUE' ? '🔵 Mavi Yaka' 
    : r.target_value === 'WHITE' ? '⚪ Beyaz Yaka' 
    : r.target_value;
  console.log(`  ${label} → ${r.egitim}`);
}

await pool.end();
console.log('\n🎉 Migration tamamlandı!');
