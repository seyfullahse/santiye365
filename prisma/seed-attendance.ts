import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: "postgresql://postgres:postgres@localhost:55432/santiye360?schema=public" });
  const prisma = new PrismaClient({ adapter });

  // Mevcut puantaj kayıt sayısı
  const count = await prisma.attendance.count();
  console.log("Mevcut puantaj kaydı:", count);

  if (count > 0) {
    const sample = await prisma.attendance.findMany({
      take: 3,
      select: { date: true, status: true, totalHours: true, overtime: true, workerId: true },
    });
    console.log("Örnek:", JSON.stringify(sample, null, 2));
    await prisma.$disconnect();
    return;
  }

  // Mart 2026 için demo puantaj verileri oluştur
  console.log("Puantaj verisi yok — Mart 2026 demo verileri ekleniyor...");

  const workers = await prisma.worker.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  const statuses = ["PRESENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT", "HALF_DAY", "ABSENT"] as const;
  const records: Array<{
    workerId: string;
    date: Date;
    shift: "DAY" | "NIGHT";
    status: string;
    totalHours: number;
    overtime: number;
    note: string | null;
  }> = [];

  // 1-9 Mart 2026 (bugüne kadar)
  for (const worker of workers) {
    for (let day = 1; day <= 8; day++) {
      const date = new Date(`2026-03-${String(day).padStart(2, "0")}T00:00:00.000Z`);
      const dow = date.getDay(); // 0=pazar, 6=cumartesi

      // Hafta sonu atla
      if (dow === 0 || dow === 6) continue;

      const statusIdx = Math.floor(Math.random() * statuses.length);
      const status = statuses[statusIdx];

      let totalHours = 0;
      let overtime = 0;

      if (status === "PRESENT") {
        totalHours = 8 + Math.floor(Math.random() * 3); // 8-10 saat
        overtime = totalHours > 8 ? totalHours - 8 : 0;
      } else if (status === "HALF_DAY") {
        totalHours = 4;
        overtime = 0;
      }

      records.push({
        workerId: worker.id,
        date,
        shift: "DAY",
        status,
        totalHours,
        overtime,
        note: null,
      });
    }
  }

  // Toplu ekleme
  const result = await prisma.attendance.createMany({
    data: records,
    skipDuplicates: true,
  });

  console.log(`${result.count} puantaj kaydı eklendi (${workers.length} çalışan × iş günleri)`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
