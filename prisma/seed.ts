import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL ortam değişkeni tanımlı değil");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  // Admin kullanıcısı oluştur
  const hashedPassword = await bcrypt.hash("admin123", 12);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@santiye360.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@santiye360.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Admin kullanıcısı oluşturuldu:", admin.email);

  // Disiplinler
  const disciplines = [
    "Mimari",
    "Statik",
    "Mekanik",
    "Elektrik",
    "Altyapı",
    "Peyzaj",
    "Mobilya",
  ];

  for (const name of disciplines) {
    await prisma.discipline.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("Disiplinler oluşturuldu");

  // Demo proje
  const project = await prisma.project.create({
    data: {
      name: "Merkez Plaza İnşaatı",
      client: "ABC Holding",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2027-06-30"),
      status: "ACTIVE",
    },
  });
  console.log("Demo proje oluşturuldu:", project.name);

  // Mahaller
  const zone1 = await prisma.zone.create({
    data: {
      projectId: project.id,
      name: "A Blok",
      description: "Ana ofis binası",
    },
  });

  const zone2 = await prisma.zone.create({
    data: {
      projectId: project.id,
      name: "B Blok",
      description: "Ticari alanlar",
    },
  });

  // Katlar
  const floors = [];
  for (let i = -1; i <= 5; i++) {
    const floorName = i < 0 ? `B${Math.abs(i)}` : i === 0 ? "Zemin Kat" : `${i}. Kat`;
    const floor = await prisma.floor.create({
      data: {
        projectId: project.id,
        zoneId: zone1.id,
        name: floorName,
        orderNo: i + 2,
      },
    });
    floors.push(floor);
  }
  console.log("Katlar oluşturuldu");

  // Disiplin verilerini al
  const mimari = await prisma.discipline.findUnique({ where: { name: "Mimari" } });
  const mekanik = await prisma.discipline.findUnique({ where: { name: "Mekanik" } });
  const elektrik = await prisma.discipline.findUnique({ where: { name: "Elektrik" } });
  const mobilya = await prisma.discipline.findUnique({ where: { name: "Mobilya" } });

  if (!mimari || !mekanik || !elektrik || !mobilya) {
    throw new Error("Disiplinler bulunamadı");
  }

  // Aktiviteler
  const activitiesData = [
    { name: "Kaba İnşaat", weight: 25, progress: 85, discipline: mimari.id, isCritical: true },
    { name: "Duvar Örme", weight: 15, progress: 60, discipline: mimari.id, isCritical: false },
    { name: "Sıva İşleri", weight: 10, progress: 30, discipline: mimari.id, isCritical: false },
    { name: "Mekanik Tesisat", weight: 20, progress: 45, discipline: mekanik.id, isCritical: true },
    { name: "Elektrik Tesisat", weight: 15, progress: 50, discipline: elektrik.id, isCritical: true },
    { name: "Boya Badana", weight: 5, progress: 0, discipline: mimari.id, isCritical: false },
    { name: "Döşeme Kaplaması", weight: 5, progress: 10, discipline: mimari.id, isCritical: false },
    { name: "Cephe Giydirme", weight: 5, progress: 20, discipline: mimari.id, isCritical: true },
    { name: "Ofis Mobilyaları", weight: 5, progress: 15, discipline: mobilya.id, isCritical: false },
  ];

  const activities = [];
  for (const act of activitiesData) {
    const activity = await prisma.activity.create({
      data: {
        projectId: project.id,
        zoneId: zone1.id,
        floorId: floors[2].id, // Zemin kat
        disciplineId: act.discipline,
        name: act.name,
        weight: act.weight,
        progressPercent: act.progress,
        plannedStart: new Date("2026-01-15"),
        plannedFinish: new Date("2026-06-30"),
        forecastFinish: new Date("2026-07-15"),
        isCritical: act.isCritical,
        status: act.progress >= 100 ? "COMPLETED" : act.progress > 0 ? "IN_PROGRESS" : "NOT_STARTED",
      },
    });
    activities.push(activity);
  }
  console.log("Aktiviteler oluşturuldu");

  // Onaylar
  await prisma.approval.createMany({
    data: [
      {
        activityId: activities[0].id,
        title: "Beton kalitesi onayı",
        waitingOn: "Yapı Denetim",
        waitingDays: 5,
        impactType: "DURATION",
        status: "WAITING",
      },
      {
        activityId: activities[3].id,
        title: "Mekanik proje revizyonu",
        waitingOn: "Proje Müdürü",
        waitingDays: 3,
        impactType: "BOTH",
        status: "WAITING",
      },
    ],
  });
  console.log("Onaylar oluşturuldu");

  // Riskler
  await prisma.risk.createMany({
    data: [
      {
        projectId: project.id,
        activityId: activities[0].id,
        title: "Beton tedarik gecikmesi",
        impact: 4,
        probability: 3,
        score: 12,
        action: "Alternatif tedarikçi araştırılacak",
        responsible: "Satın Alma Müdürü",
        status: "OPEN",
      },
      {
        projectId: project.id,
        title: "İş güvenliği riski - yüksekte çalışma",
        impact: 5,
        probability: 2,
        score: 10,
        action: "Güvenlik eğitimi ve ekipman kontrolü",
        responsible: "İSG Uzmanı",
        status: "OPEN",
      },
      {
        projectId: project.id,
        activityId: activities[4].id,
        title: "Elektrik malzeme fiyat artışı",
        impact: 3,
        probability: 4,
        score: 12,
        action: "Erken sipariş verilecek",
        responsible: "Proje Müdürü",
        status: "OPEN",
      },
    ],
  });
  console.log("Riskler oluşturuldu");

  // Şirketler ve ekipler
  const mainCompany = await prisma.company.create({
    data: { name: "Santiye360 İnşaat", type: "MAIN" },
  });

  const subCompany = await prisma.company.create({
    data: { name: "Yıldız Tesisat", type: "SUBCONTRACTOR" },
  });

  const team1 = await prisma.team.create({
    data: {
      companyId: mainCompany.id,
      name: "Kaba İnşaat Ekibi",
      disciplineId: mimari.id,
    },
  });

  const team2 = await prisma.team.create({
    data: {
      companyId: subCompany.id,
      name: "Mekanik Tesisat Ekibi",
      disciplineId: mekanik.id,
    },
  });
  console.log("Şirketler ve ekipler oluşturuldu");

  // Günlük personel (son 14 gün)
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    await prisma.workforceDaily.create({
      data: {
        projectId: project.id,
        date: date,
        teamId: team1.id,
        workerCount: Math.floor(Math.random() * 10) + 15,
      },
    });
    await prisma.workforceDaily.create({
      data: {
        projectId: project.id,
        date: date,
        teamId: team2.id,
        workerCount: Math.floor(Math.random() * 5) + 8,
      },
    });
  }
  console.log("Günlük personel verileri oluşturuldu");

  console.log("\n✅ Seed tamamlandı!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
