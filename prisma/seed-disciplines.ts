// Teklif Modülü - Disiplin Seed Scripti
// Kullanım: npx tsx prisma/seed-disciplines.ts

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:55432/santiye360";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const disciplines = [
  { code: "KABA", name: "Kaba İnşaat", color: "#6B7280", icon: "HardHat", sortOrder: 1 },
  { code: "INCE", name: "İnce İnşaat", color: "#8B5CF6", icon: "Layers", sortOrder: 2 },
  { code: "CELIK", name: "Çelik Yapı", color: "#3B82F6", icon: "Building2", sortOrder: 3 },
  { code: "MEKA", name: "Mekanik Tesisat", color: "#14B8A6", icon: "Wrench", sortOrder: 4 },
  { code: "ELEK", name: "Elektrik Tesisat", color: "#F59E0B", icon: "Zap", sortOrder: 5 },
  { code: "ALTI", name: "Altyapı", color: "#64748B", icon: "Cable", sortOrder: 6 },
  { code: "IZOL", name: "İzolasyon", color: "#06B6D4", icon: "Droplets", sortOrder: 7 },
  { code: "YANG", name: "Yangın Tesisatı", color: "#EF4444", icon: "Flame", sortOrder: 8 },
  { code: "ASAN", name: "Asansör", color: "#22C55E", icon: "Boxes", sortOrder: 9 },
  { code: "PEYZ", name: "Peyzaj", color: "#84CC16", icon: "TreePine", sortOrder: 10 },
  { code: "HAFR", name: "Hafriyat & Zemin", color: "#A16207", icon: "Shovel", sortOrder: 11 },
  { code: "PREF", name: "Prefabrik & Cephe", color: "#EC4899", icon: "Building2", sortOrder: 12 },
];

async function main() {
  console.log("Disiplinler yükleniyor...");
  for (const d of disciplines) {
    await prisma.teklifDiscipline.upsert({
      where: { code: d.code },
      update: { name: d.name, color: d.color, icon: d.icon, sortOrder: d.sortOrder },
      create: d,
    });
    console.log(`  ✓ ${d.code} - ${d.name}`);
  }
  console.log(`\n${disciplines.length} disiplin yüklendi.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
