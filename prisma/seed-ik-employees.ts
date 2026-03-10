import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

async function main() {
  const adapter = new PrismaPg({ connectionString: "postgresql://postgres:postgres@localhost:55432/santiye360?schema=public" });
  const prisma = new PrismaClient({ adapter });

  // Ana yüklenici bul
  const mainCompany = await prisma.company.findFirst({ where: { type: "MAIN" } });
  if (!mainCompany) throw new Error("Ana yüklenici bulunamadı!");
  console.log("Ana Yüklenici:", mainCompany.name, mainCompany.id);

  // Proje
  const project = await prisma.project.findFirst();

  // Ekipler
  const beyazYaka = await prisma.team.findFirst({ where: { companyId: mainCompany.id, name: { contains: "Beyaz" } } });
  const maviYaka = await prisma.team.findFirst({ where: { companyId: mainCompany.id, name: { contains: "Mavi" } } });
  console.log("Beyaz Yaka:", beyazYaka?.id);
  console.log("Mavi Yaka:", maviYaka?.id);

  // ─── DEPARTMANLAR ───
  const departmanlar = [
    "Genel Müdürlük",
    "İnşaat",
    "Elektrik",
    "Mekanik",
    "İSG",
    "Kalite Kontrol",
    "Planlama",
    "Satınalma",
    "Muhasebe",
    "İnsan Kaynakları",
  ];

  const deptMap = new Map<string, string>();
  for (const name of departmanlar) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    deptMap.set(name, dept.id);
  }
  console.log(`${deptMap.size} departman oluşturuldu`);

  // ─── POZİSYONLAR ───
  // Pozisyon-departman eşleşmesi
  const pozisyonDept: Array<{ name: string; dept: string }> = [
    { name: "Proje Müdürü", dept: "Genel Müdürlük" },
    { name: "Şantiye Şefi", dept: "İnşaat" },
    { name: "İnşaat Mühendisi", dept: "İnşaat" },
    { name: "Elektrik Mühendisi", dept: "Elektrik" },
    { name: "Makine Mühendisi", dept: "Mekanik" },
    { name: "Mimar", dept: "Genel Müdürlük" },
    { name: "Teknik Ressam", dept: "İnşaat" },
    { name: "İSG Uzmanı", dept: "İSG" },
    { name: "Kalite Kontrol Mühendisi", dept: "Kalite Kontrol" },
    { name: "Planlama Mühendisi", dept: "Planlama" },
    { name: "Satınalma Uzmanı", dept: "Satınalma" },
    { name: "Muhasebeci", dept: "Muhasebe" },
    { name: "İK Uzmanı", dept: "İnsan Kaynakları" },
    { name: "Saha Amiri", dept: "İnşaat" },
    { name: "Formen", dept: "İnşaat" },
    { name: "Kalıpçı Ustası", dept: "İnşaat" },
    { name: "Demirci Ustası", dept: "İnşaat" },
    { name: "İnşaat İşçisi", dept: "İnşaat" },
    { name: "Elektrikçi", dept: "Elektrik" },
    { name: "Tesisatçı", dept: "Mekanik" },
    { name: "Boyacı", dept: "İnşaat" },
    { name: "Operatör", dept: "İnşaat" },
    { name: "Şoför", dept: "İnşaat" },
    { name: "Güvenlik", dept: "İSG" },
    { name: "Temizlik Görevlisi", dept: "İnşaat" },
  ];

  const posMap = new Map<string, string>();
  for (const pd of pozisyonDept) {
    const depId = deptMap.get(pd.dept);
    if (!depId) { console.log("Departman bulunamadı:", pd.dept); continue; }
    const pos = await prisma.position.create({
      data: { name: pd.name, departmentId: depId },
    });
    posMap.set(pd.name, pos.id);
  }
  console.log(`${posMap.size} pozisyon oluşturuldu`);

  // ─── 50 PERSONEL ───
  // Beyaz Yaka: üst yönetim + mühendisler + ofis (20 kişi)
  // Mavi Yaka: saha çalışanları (30 kişi)

  const beyazYakaPersonel = [
    { firstName: "Mehmet", lastName: "Barış", dept: "Genel Müdürlük", pos: "Proje Müdürü", gender: "MALE", salary: 85000 },
    { firstName: "Ayşe", lastName: "Demir", dept: "Genel Müdürlük", pos: "Mimar", gender: "FEMALE", salary: 65000 },
    { firstName: "Ali", lastName: "Kaya", dept: "İnşaat", pos: "Şantiye Şefi", gender: "MALE", salary: 72000 },
    { firstName: "Fatma", lastName: "Yıldız", dept: "İnşaat", pos: "İnşaat Mühendisi", gender: "FEMALE", salary: 55000 },
    { firstName: "Burak", lastName: "Özkan", dept: "İnşaat", pos: "İnşaat Mühendisi", gender: "MALE", salary: 52000 },
    { firstName: "Elif", lastName: "Arslan", dept: "Elektrik", pos: "Elektrik Mühendisi", gender: "FEMALE", salary: 54000 },
    { firstName: "Serkan", lastName: "Çelik", dept: "Mekanik", pos: "Makine Mühendisi", gender: "MALE", salary: 54000 },
    { firstName: "Deniz", lastName: "Aydın", dept: "Planlama", pos: "Planlama Mühendisi", gender: "FEMALE", salary: 50000 },
    { firstName: "Emre", lastName: "Şahin", dept: "Kalite Kontrol", pos: "Kalite Kontrol Mühendisi", gender: "MALE", salary: 48000 },
    { firstName: "Selin", lastName: "Koç", dept: "İSG", pos: "İSG Uzmanı", gender: "FEMALE", salary: 47000 },
    { firstName: "Murat", lastName: "Güneş", dept: "İSG", pos: "İSG Uzmanı", gender: "MALE", salary: 46000 },
    { firstName: "Zeynep", lastName: "Aktaş", dept: "Satınalma", pos: "Satınalma Uzmanı", gender: "FEMALE", salary: 42000 },
    { firstName: "Hakan", lastName: "Doğan", dept: "Satınalma", pos: "Satınalma Uzmanı", gender: "MALE", salary: 41000 },
    { firstName: "Gül", lastName: "Ertürk", dept: "Muhasebe", pos: "Muhasebeci", gender: "FEMALE", salary: 43000 },
    { firstName: "Oğuz", lastName: "Polat", dept: "Muhasebe", pos: "Muhasebeci", gender: "MALE", salary: 42000 },
    { firstName: "Ceren", lastName: "Tuncer", dept: "İnsan Kaynakları", pos: "İK Uzmanı", gender: "FEMALE", salary: 44000 },
    { firstName: "Tolga", lastName: "Yılmaz", dept: "İnşaat", pos: "Teknik Ressam", gender: "MALE", salary: 38000 },
    { firstName: "Pınar", lastName: "Karaca", dept: "İnşaat", pos: "Teknik Ressam", gender: "FEMALE", salary: 37000 },
    { firstName: "Cem", lastName: "Erdoğan", dept: "Mekanik", pos: "Makine Mühendisi", gender: "MALE", salary: 53000 },
    { firstName: "Esra", lastName: "Bayrak", dept: "Planlama", pos: "Planlama Mühendisi", gender: "FEMALE", salary: 49000 },
  ];

  const maviYakaPersonel = [
    { firstName: "Hüseyin", lastName: "Kırmızı", dept: "İnşaat", pos: "Saha Amiri", gender: "MALE", salary: 38000 },
    { firstName: "İbrahim", lastName: "Taş", dept: "İnşaat", pos: "Formen", gender: "MALE", salary: 32000 },
    { firstName: "Yusuf", lastName: "Güler", dept: "İnşaat", pos: "Formen", gender: "MALE", salary: 31000 },
    { firstName: "Mustafa", lastName: "Ak", dept: "İnşaat", pos: "Kalıpçı Ustası", gender: "MALE", salary: 28000 },
    { firstName: "Recep", lastName: "Kara", dept: "İnşaat", pos: "Kalıpçı Ustası", gender: "MALE", salary: 27000 },
    { firstName: "Ahmet", lastName: "Demirtaş", dept: "İnşaat", pos: "Demirci Ustası", gender: "MALE", salary: 28000 },
    { firstName: "Ömer", lastName: "Toprak", dept: "İnşaat", pos: "Demirci Ustası", gender: "MALE", salary: 27000 },
    { firstName: "Kemal", lastName: "Aslan", dept: "İnşaat", pos: "İnşaat İşçisi", gender: "MALE", salary: 22000 },
    { firstName: "Halit", lastName: "Yıldırım", dept: "İnşaat", pos: "İnşaat İşçisi", gender: "MALE", salary: 22000 },
    { firstName: "Ramazan", lastName: "Bulut", dept: "İnşaat", pos: "İnşaat İşçisi", gender: "MALE", salary: 22000 },
    { firstName: "Erkan", lastName: "Duman", dept: "İnşaat", pos: "İnşaat İşçisi", gender: "MALE", salary: 22000 },
    { firstName: "Ferhat", lastName: "Koçak", dept: "İnşaat", pos: "İnşaat İşçisi", gender: "MALE", salary: 22000 },
    { firstName: "Salih", lastName: "Öztürk", dept: "İnşaat", pos: "İnşaat İşçisi", gender: "MALE", salary: 22000 },
    { firstName: "Cemal", lastName: "Acar", dept: "İnşaat", pos: "İnşaat İşçisi", gender: "MALE", salary: 22000 },
    { firstName: "Uğur", lastName: "Çetin", dept: "İnşaat", pos: "İnşaat İşçisi", gender: "MALE", salary: 22000 },
    { firstName: "Tuncay", lastName: "Yalçın", dept: "Elektrik", pos: "Elektrikçi", gender: "MALE", salary: 26000 },
    { firstName: "Selim", lastName: "Parlak", dept: "Elektrik", pos: "Elektrikçi", gender: "MALE", salary: 25000 },
    { firstName: "Erdal", lastName: "Şen", dept: "Mekanik", pos: "Tesisatçı", gender: "MALE", salary: 26000 },
    { firstName: "Hayri", lastName: "Kaplan", dept: "Mekanik", pos: "Tesisatçı", gender: "MALE", salary: 25000 },
    { firstName: "Orhan", lastName: "Ateş", dept: "İnşaat", pos: "Boyacı", gender: "MALE", salary: 24000 },
    { firstName: "Cengiz", lastName: "Vural", dept: "İnşaat", pos: "Boyacı", gender: "MALE", salary: 23000 },
    { firstName: "Bülent", lastName: "Sönmez", dept: "İnşaat", pos: "Operatör", gender: "MALE", salary: 30000 },
    { firstName: "Metin", lastName: "Güneş", dept: "İnşaat", pos: "Operatör", gender: "MALE", salary: 29000 },
    { firstName: "Bayram", lastName: "Kılıç", dept: "İnşaat", pos: "Operatör", gender: "MALE", salary: 28000 },
    { firstName: "Necati", lastName: "Kurt", dept: "İnşaat", pos: "Şoför", gender: "MALE", salary: 26000 },
    { firstName: "Sedat", lastName: "Yılmaz", dept: "İnşaat", pos: "Şoför", gender: "MALE", salary: 25000 },
    { firstName: "Adem", lastName: "Can", dept: "İnşaat", pos: "İnşaat İşçisi", gender: "MALE", salary: 22000 },
    { firstName: "Yaşar", lastName: "Dağ", dept: "İnşaat", pos: "İnşaat İşçisi", gender: "MALE", salary: 22000 },
    { firstName: "Bekir", lastName: "Savaş", dept: "İSG", pos: "Güvenlik", gender: "MALE", salary: 23000 },
    { firstName: "Ayhan", lastName: "Konak", dept: "İSG", pos: "Güvenlik", gender: "MALE", salary: 23000 },
  ];

  let created = 0;
  const generateTC = () => {
    let tc = String(Math.floor(Math.random() * 9) + 1);
    for (let i = 0; i < 10; i++) tc += Math.floor(Math.random() * 10);
    return tc;
  };

  const generateEmpNo = (i: number) => `BRS-${String(i + 1).padStart(3, "0")}`;

  // Beyaz Yaka personeli
  for (let i = 0; i < beyazYakaPersonel.length; i++) {
    const p = beyazYakaPersonel[i];
    const tc = generateTC();
    await prisma.employee.create({
      data: {
        firstName: p.firstName,
        lastName: p.lastName,
        tcNo: tc,
        gender: p.gender as "MALE" | "FEMALE",
        phone: `053${Math.floor(Math.random() * 100000000).toString().padStart(8, "0")}`,
        companyId: mainCompany.id,
        departmentId: deptMap.get(p.dept)!,
        positionId: posMap.get(p.pos)!,
        projectId: project?.id,
        teamId: beyazYaka?.id,
        employeeNo: generateEmpNo(i),
        hireDate: new Date(`2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`),
        salary: p.salary,
        salaryType: "MONTHLY",
        status: "ACTIVE",
      },
    });
    created++;
  }

  // Mavi Yaka personeli
  for (let i = 0; i < maviYakaPersonel.length; i++) {
    const p = maviYakaPersonel[i];
    const tc = generateTC();
    await prisma.employee.create({
      data: {
        firstName: p.firstName,
        lastName: p.lastName,
        tcNo: tc,
        gender: p.gender as "MALE" | "FEMALE",
        phone: `054${Math.floor(Math.random() * 100000000).toString().padStart(8, "0")}`,
        companyId: mainCompany.id,
        departmentId: deptMap.get(p.dept)!,
        positionId: posMap.get(p.pos)!,
        projectId: project?.id,
        teamId: maviYaka?.id,
        employeeNo: generateEmpNo(beyazYakaPersonel.length + i),
        hireDate: new Date(`2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`),
        salary: p.salary,
        salaryType: "MONTHLY",
        status: "ACTIVE",
      },
    });
    created++;
  }

  console.log(`\n✅ ${created} personel oluşturuldu (Barış İnşaat - Ana Yüklenici)`);
  console.log(`   Beyaz Yaka: ${beyazYakaPersonel.length}`);
  console.log(`   Mavi Yaka: ${maviYakaPersonel.length}`);

  // Ayrıca bu personelleri Worker tablosuna da ekleyelim (puantaj için)
  console.log("\nPuantaj (Worker) kayıtları oluşturuluyor...");
  
  const employees = await prisma.employee.findMany({
    where: { companyId: mainCompany.id, status: "ACTIVE" },
    include: { position: true, team: true },
  });

  let workerCreated = 0;
  for (const emp of employees) {
    if (!emp.teamId) continue;
    // Aynı TC ile worker var mı kontrol
    const existing = await prisma.worker.findFirst({
      where: { firstName: emp.firstName, lastName: emp.lastName, teamId: emp.teamId },
    });
    if (existing) continue;

    await prisma.worker.create({
      data: {
        teamId: emp.teamId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        role: emp.position?.name ?? "Personel",
        identityNo: emp.tcNo,
        phone: emp.phone,
        dailyRate: Math.round((emp.salary ?? 0) / 30),
        overtimeRate: Math.round(((emp.salary ?? 0) / 30 / 8) * 1.5),
        isActive: true,
        startDate: emp.hireDate,
      },
    });
    workerCreated++;
  }

  console.log(`✅ ${workerCreated} Worker kaydı oluşturuldu (puantaj sistemi için)`);

  // Özet
  const totalWorkers = await prisma.worker.count({ where: { isActive: true } });
  const mainWorkers = await prisma.worker.count({
    where: { isActive: true, team: { company: { type: "MAIN" } } },
  });
  const subWorkers = await prisma.worker.count({
    where: { isActive: true, team: { company: { type: "SUBCONTRACTOR" } } },
  });

  console.log(`\n=== PUANTAJ ÖZET ===`);
  console.log(`  Toplam Worker: ${totalWorkers}`);
  console.log(`  Ana Yüklenici: ${mainWorkers}`);
  console.log(`  Taşeron: ${subWorkers}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
