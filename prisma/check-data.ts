import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: "postgresql://postgres:postgres@localhost:55432/santiye360?schema=public" });
  const prisma = new PrismaClient({ adapter });

  // Firmalar
  const companies = await prisma.company.findMany({ select: { id: true, name: true, type: true } });
  console.log("=== FİRMALAR ===");
  companies.forEach((c) => console.log(`  ${c.type} | ${c.name} (${c.id})`));

  // Ana yüklenici
  const main = companies.find((c) => c.type === "MAIN");
  console.log("\nAna Yüklenici:", main ? main.name : "YOK");

  // Departmanlar
  const depts = await prisma.department.findMany({ select: { id: true, name: true } });
  console.log("\n=== DEPARTMANLAR ===");
  depts.forEach((d) => console.log(`  ${d.name} (${d.id})`));

  // Pozisyonlar
  const positions = await prisma.position.findMany({ select: { id: true, name: true } });
  console.log("\n=== POZİSYONLAR ===");
  positions.forEach((p) => console.log(`  ${p.name} (${p.id})`));

  // Mevcut Employee sayısı
  const empCount = await prisma.employee.count();
  console.log("\nMevcut Employee sayısı:", empCount);

  // Barış İnşaat ekipleri
  if (main) {
    const teams = await prisma.team.findMany({ where: { companyId: main.id }, select: { id: true, name: true } });
    console.log("\n=== ANA YÜKLENİCİ EKİPLERİ ===");
    teams.forEach((t) => console.log(`  ${t.name} (${t.id})`));
  }

  // Worker sayısı (firma bazlı)
  const workerStats = await prisma.worker.groupBy({
    by: ["teamId"],
    _count: { id: true },
  });
  console.log("\n=== WORKER (PUANTAJ) SAYILARI ===");
  for (const ws of workerStats) {
    const team = await prisma.team.findUnique({ where: { id: ws.teamId }, include: { company: { select: { name: true, type: true } } } });
    console.log(`  ${team?.company.name} (${team?.company.type}) - ${team?.name}: ${ws._count.id} kişi`);
  }

  // Projeler
  const projects = await prisma.project.findMany({ select: { id: true, name: true }, take: 5 });
  console.log("\n=== PROJELER ===");
  projects.forEach((p) => console.log(`  ${p.name} (${p.id})`));

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
