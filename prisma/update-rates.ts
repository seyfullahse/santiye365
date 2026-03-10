import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: "postgresql://postgres:postgres@localhost:55432/santiye360?schema=public" });
  const prisma = new PrismaClient({ adapter });

  const result = await prisma.worker.updateMany({
    where: { isActive: true },
    data: { dailyRate: 3500, overtimeRate: 500 },
  });

  console.log("Güncellenen çalışan sayısı:", result.count);

  const sample = await prisma.worker.findMany({
    take: 5,
    select: { firstName: true, lastName: true, dailyRate: true, overtimeRate: true },
  });
  console.log("Örnek:", JSON.stringify(sample, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
