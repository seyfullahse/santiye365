/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Şantiye360 — İzin Sistemi Seed Data
 *
 * Kullanım: npx tsx prisma/seed-permissions.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config(); // .env dosyasını yükle

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter }) as any;

// ─── Tüm İzin Tanımları ─────────────────────────────────────

const ALL_PERMISSIONS = [
  // Projeler
  { module: "projeler", action: "read", description: "Projeleri görüntüleme" },
  { module: "projeler", action: "create", description: "Yeni proje oluşturma" },
  { module: "projeler", action: "update", description: "Proje düzenleme" },
  { module: "projeler", action: "delete", description: "Proje silme" },
  // Puantaj
  { module: "puantaj", action: "read", description: "Puantaj kayıtlarını görüntüleme" },
  { module: "puantaj", action: "write", description: "Puantaj girişi yapma" },
  { module: "puantaj", action: "delete", description: "Puantaj kaydı silme" },
  // Hakediş
  { module: "hakedis", action: "read", description: "Hakediş verilerini görüntüleme" },
  { module: "hakedis", action: "write", description: "Hakediş verisi girme/düzenleme" },
  { module: "hakedis", action: "delete", description: "Hakediş kaydı silme" },
  // İK
  { module: "ik", action: "read", description: "İK verilerini görüntüleme" },
  { module: "ik", action: "write", description: "İK verisi girme/düzenleme" },
  { module: "ik", action: "delete", description: "İK kaydı silme" },
  // İzin
  { module: "izin", action: "request", description: "İzin talebi oluşturma" },
  { module: "izin", action: "approve", description: "İzin talebi onaylama" },
  // İSG
  { module: "isg", action: "read", description: "İSG verilerini görüntüleme" },
  { module: "isg", action: "write", description: "İSG verisi girme/düzenleme" },
  // Muhasebe
  { module: "muhasebe", action: "read", description: "Muhasebe verilerini görüntüleme" },
  { module: "muhasebe", action: "write", description: "Muhasebe verisi girme/düzenleme" },
  // Duyurular
  { module: "duyurular", action: "read", description: "Duyuruları görüntüleme" },
  { module: "duyurular", action: "create", description: "Duyuru oluşturma" },
  { module: "duyurular", action: "delete", description: "Duyuru silme" },
  // İndirimler
  { module: "indirimler", action: "read", description: "İndirim listesini görüntüleme" },
  // Şirketler
  { module: "sirketler", action: "read", description: "Şirket bilgilerini görüntüleme" },
  { module: "sirketler", action: "write", description: "Şirket bilgisi düzenleme" },
  // Kullanıcılar
  { module: "kullanicilar", action: "read", description: "Kullanıcıları görüntüleme" },
  { module: "kullanicilar", action: "write", description: "Kullanıcı oluşturma/düzenleme" },
  { module: "kullanicilar", action: "delete", description: "Kullanıcı silme" },
  // CRM
  { module: "crm", action: "read", description: "CRM verilerini görüntüleme" },
  { module: "crm", action: "write", description: "CRM verisi girme/düzenleme" },
  // Taşeron
  { module: "taseron", action: "read", description: "Taşeron verilerini görüntüleme" },
  { module: "taseron", action: "write", description: "Taşeron verisi girme/düzenleme" },
  // Toplantı
  { module: "toplanti", action: "read", description: "Toplantı tutanaklarını görüntüleme" },
  { module: "toplanti", action: "write", description: "Toplantı tutanağı oluşturma/düzenleme" },
  // Sunum
  { module: "sunum", action: "read", description: "Sunumları görüntüleme" },
  { module: "sunum", action: "write", description: "Sunum oluşturma/düzenleme" },
  // Teklif & İhale
  { module: "teklif", action: "read", description: "Teklif/ihale verilerini görüntüleme" },
  { module: "teklif", action: "write", description: "Teklif/ihale verisi girme/düzenleme" },
  // Yatırım & GYO
  { module: "yatirim", action: "read", description: "Yatırım verilerini görüntüleme" },
  { module: "yatirim", action: "write", description: "Yatırım verisi girme/düzenleme" },
  // Organizasyon
  { module: "organizasyon", action: "read", description: "Organizasyon şemasını görüntüleme" },
  { module: "organizasyon", action: "write", description: "Organizasyon düzenleme" },
  // Maskot AI
  { module: "maskot", action: "read", description: "Maskot AI kullanma" },
  { module: "maskot", action: "write", description: "Maskot AI ayarlarını düzenleme" },
  // Ayarlar
  { module: "ayarlar", action: "read", description: "Ayarları görüntüleme" },
  { module: "ayarlar", action: "write", description: "Ayarları düzenleme" },
  // Yönetim Paneli
  { module: "yonetim-paneli", action: "read", description: "Yönetim panelini görüntüleme" },
];

// ─── Rol → İzin Eşleştirmesi ─────────────────────────────────

type Scope = "NONE" | "SELF" | "PROJECT" | "COMPANY" | "GLOBAL";

const ROLE_PERMISSION_MAP: Record<string, Record<string, Scope>> = {
  ADMIN: {
    "projeler:read": "GLOBAL", "projeler:create": "GLOBAL", "projeler:update": "GLOBAL",
    "puantaj:read": "GLOBAL", "puantaj:write": "GLOBAL", "puantaj:delete": "GLOBAL",
    "hakedis:read": "GLOBAL", "hakedis:write": "GLOBAL",
    "ik:read": "GLOBAL", "ik:write": "GLOBAL",
    "izin:request": "GLOBAL", "izin:approve": "GLOBAL",
    "isg:read": "GLOBAL", "isg:write": "GLOBAL",
    "muhasebe:read": "GLOBAL", "muhasebe:write": "GLOBAL",
    "duyurular:read": "GLOBAL", "duyurular:create": "GLOBAL", "duyurular:delete": "GLOBAL",
    "indirimler:read": "GLOBAL",
    "sirketler:read": "GLOBAL", "sirketler:write": "GLOBAL",
    "kullanicilar:read": "GLOBAL", "kullanicilar:write": "GLOBAL",
    "crm:read": "GLOBAL", "crm:write": "GLOBAL",
    "taseron:read": "GLOBAL", "taseron:write": "GLOBAL",
    "toplanti:read": "GLOBAL", "toplanti:write": "GLOBAL",
    "sunum:read": "GLOBAL", "sunum:write": "GLOBAL",
    "teklif:read": "GLOBAL", "teklif:write": "GLOBAL",
    "yatirim:read": "GLOBAL", "yatirim:write": "GLOBAL",
    "organizasyon:read": "GLOBAL", "organizasyon:write": "GLOBAL",
    "maskot:read": "GLOBAL", "maskot:write": "GLOBAL",
    "ayarlar:read": "GLOBAL", "ayarlar:write": "GLOBAL",
    "yonetim-paneli:read": "GLOBAL",
  },
  PROJECT_ADMIN: {
    "projeler:read": "PROJECT", "projeler:update": "PROJECT",
    "puantaj:read": "PROJECT", "puantaj:write": "PROJECT",
    "hakedis:read": "PROJECT", "hakedis:write": "PROJECT",
    "ik:read": "PROJECT", "ik:write": "PROJECT",
    "izin:request": "GLOBAL", "izin:approve": "PROJECT",
    "isg:read": "PROJECT", "isg:write": "PROJECT",
    "sirketler:read": "GLOBAL",
    "taseron:read": "PROJECT", "taseron:write": "PROJECT",
    "toplanti:read": "PROJECT", "toplanti:write": "PROJECT",
    "duyurular:read": "GLOBAL",
    "indirimler:read": "GLOBAL",
    "organizasyon:read": "GLOBAL",
    "ayarlar:read": "SELF",
  },
  MANAGER: {
    "projeler:read": "PROJECT",
    "puantaj:read": "PROJECT", "puantaj:write": "PROJECT",
    "hakedis:read": "PROJECT",
    "ik:read": "PROJECT",
    "izin:request": "GLOBAL", "izin:approve": "GLOBAL",
    "isg:read": "PROJECT", "isg:write": "PROJECT",
    "sirketler:read": "GLOBAL",
    "duyurular:read": "GLOBAL",
    "indirimler:read": "GLOBAL",
    "organizasyon:read": "GLOBAL",
    "toplanti:read": "PROJECT", "toplanti:write": "PROJECT",
    "ayarlar:read": "SELF",
  },
  MUHASEBE: {
    "puantaj:read": "GLOBAL",
    "hakedis:read": "GLOBAL", "hakedis:write": "GLOBAL",
    "muhasebe:read": "GLOBAL", "muhasebe:write": "GLOBAL",
    "taseron:read": "GLOBAL",
    "sirketler:read": "GLOBAL",
    "duyurular:read": "GLOBAL",
    "indirimler:read": "GLOBAL",
    "izin:request": "GLOBAL",
    "ayarlar:read": "SELF",
  },
  USER: {
    "projeler:read": "PROJECT",
    "puantaj:read": "SELF",
    "ik:read": "SELF",
    "izin:request": "GLOBAL",
    "isg:read": "SELF",
    "sirketler:read": "GLOBAL",
    "duyurular:read": "GLOBAL",
    "indirimler:read": "GLOBAL",
    "organizasyon:read": "GLOBAL",
    "ayarlar:read": "SELF",
  },
  VIEWER: {
    "projeler:read": "PROJECT",
    "duyurular:read": "GLOBAL",
    "indirimler:read": "GLOBAL",
    "sirketler:read": "GLOBAL",
    "organizasyon:read": "GLOBAL",
    "ayarlar:read": "SELF",
  },
};

// ─── Onay Zincirleri ──────────────────────────────────────────

const APPROVAL_CHAINS = [
  {
    name: "İzin Talebi Onayı",
    module: "leave",
    slaHours: 48,
    steps: [
      { stepOrder: 1, name: "Direkt Yönetici", approverType: "MANAGER", autoAssign: true, slaHours: 24 },
      { stepOrder: 2, name: "Departman Müdürü", approverType: "DEPARTMENT", autoAssign: true, slaHours: 24 },
      { stepOrder: 3, name: "İK Onayı", approverType: "ROLE", approverRole: "ADMIN", slaHours: 48 },
    ],
  },
  {
    name: "Hakediş Onayı",
    module: "hakedis",
    slaHours: 72,
    steps: [
      { stepOrder: 1, name: "Proje Müdürü", approverType: "ROLE", approverRole: "PROJECT_ADMIN", slaHours: 48 },
      { stepOrder: 2, name: "Mali İşler", approverType: "ROLE", approverRole: "MUHASEBE", slaHours: 48 },
      { stepOrder: 3, name: "Genel Müdür", approverType: "ROLE", approverRole: "ADMIN", slaHours: 72 },
    ],
  },
  {
    name: "Malzeme Talebi Onayı",
    module: "malzeme",
    slaHours: 24,
    steps: [
      { stepOrder: 1, name: "Şef Onayı", approverType: "ROLE", approverRole: "MANAGER", slaHours: 12 },
      { stepOrder: 2, name: "Proje Müdürü Onayı", approverType: "ROLE", approverRole: "PROJECT_ADMIN", slaHours: 24 },
    ],
  },
  {
    name: "Puantaj Onayı",
    module: "puantaj",
    slaHours: 24,
    steps: [
      { stepOrder: 1, name: "Proje Müdürü Onayı", approverType: "ROLE", approverRole: "PROJECT_ADMIN", autoAssign: true, slaHours: 24 },
    ],
  },
];

// ─── Ana Seed Fonksiyonu ─────────────────────────────────────

async function main() {
  console.log("🔐 İzin sistemi seed başlatılıyor...\n");

  // 1) İzin tanımlarını oluştur
  console.log("📋 İzin tanımları oluşturuluyor...");
  let permCount = 0;
  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      create: perm,
      update: { description: perm.description },
    });
    permCount++;
  }
  console.log(`   ✅ ${permCount} izin tanımı oluşturuldu/güncellendi`);

  // 2) Rol izinlerini oluştur (SUPER_ADMIN hariç — o hardcoded)
  console.log("\n👥 Rol izinleri oluşturuluyor...");
  let rolePermCount = 0;
  for (const [role, perms] of Object.entries(ROLE_PERMISSION_MAP)) {
    for (const [key, scope] of Object.entries(perms)) {
      const [mod, action] = key.split(":");
      const permission = await prisma.permission.findUnique({
        where: { module_action: { module: mod, action } },
      });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId: permission.id } },
        create: { role, permissionId: permission.id, scope },
        update: { scope },
      });
      rolePermCount++;
    }
  }
  console.log(`   ✅ ${rolePermCount} rol izni oluşturuldu/güncellendi`);

  // 3) Onay zincirlerini oluştur
  console.log("\n🔗 Onay zincirleri oluşturuluyor...");
  for (const chain of APPROVAL_CHAINS) {
    const existing = await prisma.approvalChain.findUnique({
      where: { module: chain.module },
    });

    let chainId: string;
    if (existing) {
      chainId = existing.id;
      await prisma.approvalChain.update({
        where: { id: chainId },
        data: { name: chain.name, slaHours: chain.slaHours },
      });
    } else {
      const created = await prisma.approvalChain.create({
        data: { name: chain.name, module: chain.module, slaHours: chain.slaHours },
      });
      chainId = created.id;
    }

    // Adımları oluştur
    for (const step of chain.steps) {
      await prisma.approvalStep.upsert({
        where: { chainId_stepOrder: { chainId, stepOrder: step.stepOrder } },
        create: {
          chainId,
          stepOrder: step.stepOrder,
          name: step.name,
          approverType: step.approverType,
          approverRole: step.approverRole || null,
          autoAssign: step.autoAssign || false,
          slaHours: step.slaHours || null,
        },
        update: {
          name: step.name,
          approverType: step.approverType,
          approverRole: step.approverRole || null,
          autoAssign: step.autoAssign || false,
          slaHours: step.slaHours || null,
        },
      });
    }
    console.log(`   ✅ ${chain.name} — ${chain.steps.length} adım`);
  }

  console.log("\n✨ İzin sistemi seed tamamlandı!");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
