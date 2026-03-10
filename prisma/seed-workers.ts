import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL ortam değişkeni tanımlı değil");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// Türk isimleri
const erkekAdlari = [
  "Ahmet", "Mehmet", "Mustafa", "Ali", "Hasan", "Hüseyin", "İbrahim", "Murat",
  "Osman", "Yusuf", "Ramazan", "Süleyman", "Kemal", "Halil", "Recep", "Fatih",
  "Emre", "Burak", "Serkan", "Volkan", "Cem", "Uğur", "Kadir", "Tuncay", "Ercan",
  "Ferhat", "Bayram", "Cengiz", "Adem", "Yakup", "Şaban", "Engin", "Selçuk",
  "Orhan", "Tamer", "Levent", "Bülent", "Gökhan", "Sinan", "Zafer",
];

const soyadlari = [
  "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Yıldırım", "Öztürk",
  "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Koç",
  "Kurt", "Özkan", "Polat", "Erdoğan", "Türk", "Aktaş", "Güneş", "Korkmaz",
  "Tekin", "Aksoy", "Karaca", "Ateş", "Duman", "Tunç", "Başaran", "Güler",
  "Taş", "Acar", "Sönmez", "Ünal", "Kaplan", "Bozkurt", "Gündüz", "Erdem",
];

const gorevler = [
  "Kalıpçı", "Demirci", "Betoncu", "Sıvacı", "Boyacı", "Elektrikçi",
  "Tesisatçı", "Kaynakçı", "İzolasyoncu", "Alçıcı", "Seramikçi", "Duvar Ustası",
  "Formen", "Operatör", "Düz İşçi", "Fayansçı",
];

const kanGruplari = ["A+", "A-", "B+", "B-", "AB+", "AB-", "0+", "0-"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  const prefix = ["530", "531", "532", "533", "534", "535", "536", "537", "538", "539",
    "540", "541", "542", "543", "544", "545", "546", "547", "548", "549",
    "550", "551", "552", "553", "554", "555", "556", "557", "558", "559"];
  return `05${randomItem(prefix).slice(1)}${Math.floor(1000000 + Math.random() * 9000000)}`;
}

function randomTC(): string {
  // Basit 11 haneli TC benzeri numara
  let tc = String(Math.floor(10000000000 + Math.random() * 89999999999));
  return tc.slice(0, 11);
}

// Firma ve ekip yapılandırması
const firmaEkipYapisi = [
  {
    firmaAd: "Akarsu İnşaat A.Ş.",
    ekipler: [
      { ad: "Kaba Yapı Ekibi", gorevler: ["Kalıpçı", "Demirci", "Betoncu", "Formen", "Düz İşçi"], kisi: 8 },
      { ad: "Sıva & Boya Ekibi", gorevler: ["Sıvacı", "Boyacı", "Alçıcı", "Düz İşçi"], kisi: 5 },
    ],
  },
  {
    firmaAd: "Doruk Elektrik Mekanik Ltd.",
    ekipler: [
      { ad: "Elektrik Ekibi", gorevler: ["Elektrikçi", "Formen", "Düz İşçi"], kisi: 6 },
      { ad: "Mekanik Tesisat Ekibi", gorevler: ["Tesisatçı", "Kaynakçı", "Düz İşçi"], kisi: 5 },
    ],
  },
  {
    firmaAd: "Yıldız Yapı Taahhüt Ltd.",
    ekipler: [
      { ad: "İnce İşler Ekibi", gorevler: ["Seramikçi", "Fayansçı", "Duvar Ustası", "Düz İşçi"], kisi: 6 },
    ],
  },
  {
    firmaAd: "Atlas Mühendislik A.Ş.",
    ekipler: [
      { ad: "İzolasyon Ekibi", gorevler: ["İzolasyoncu", "Operatör", "Düz İşçi"], kisi: 5 },
      { ad: "Altyapı Ekibi", gorevler: ["Operatör", "Düz İşçi", "Formen"], kisi: 5 },
    ],
  },
  {
    firmaAd: "Güven Taşeronluk",
    ekipler: [
      { ad: "Genel Ekip", gorevler: ["Kalıpçı", "Demirci", "Düz İşçi", "Formen", "Sıvacı"], kisi: 10 },
    ],
  },
];

// Toplam: 8+5+6+5+6+5+5+10 = 50

async function main() {
  console.log("🏗️  50 çalışan ekleniyor...\n");

  // Mevcut projeyi bul (ekiplere atamak için)
  const project = await prisma.project.findFirst({ where: { status: "ACTIVE" } });

  // Disiplinleri bul
  let disciplines = await (prisma.discipline as any).findMany();
  if (disciplines.length === 0) {
    const defaultDisc = await (prisma.discipline as any).create({
      data: { name: "Genel" },
    });
    disciplines = [defaultDisc];
  }

  // Disiplin eşleştirme
  const discMap: Record<string, string> = {};
  for (const d of disciplines) {
    const lower = (d.name as string).toLowerCase();
    discMap[lower] = d.id;
  }
  function findDisciplineId(ekipAd: string): string {
    const lower = ekipAd.toLowerCase();
    if (lower.includes("elektrik")) return discMap["elektrik"] ?? discMap["mekanik"] ?? disciplines[0].id;
    if (lower.includes("mekanik") || lower.includes("tesisat")) return discMap["mekanik"] ?? discMap["tesisat"] ?? disciplines[0].id;
    if (lower.includes("kaba")) return discMap["kaba yapı"] ?? discMap["inşaat"] ?? disciplines[0].id;
    if (lower.includes("sıva") || lower.includes("boya") || lower.includes("ince")) return discMap["ince yapı"] ?? discMap["mimari"] ?? disciplines[0].id;
    if (lower.includes("izolasyon")) return discMap["izolasyon"] ?? discMap["yalıtım"] ?? disciplines[0].id;
    if (lower.includes("altyapı")) return discMap["altyapı"] ?? discMap["inşaat"] ?? disciplines[0].id;
    return disciplines[0].id;
  }

  let totalCreated = 0;
  const usedNames = new Set<string>();

  for (const firma of firmaEkipYapisi) {
    // Firma oluştur veya bul
    let company = await (prisma.company as any).findFirst({ where: { name: firma.firmaAd } });
    if (!company) {
      company = await (prisma.company as any).create({
        data: {
          name: firma.firmaAd,
          type: "SUBCONTRACTOR",
          phone: randomPhone(),
          isActive: true,
        },
      });
      console.log(`  ✅ Firma oluşturuldu: ${firma.firmaAd}`);
    } else {
      console.log(`  ℹ️  Firma mevcut: ${firma.firmaAd}`);
    }

    for (const ekip of firma.ekipler) {
      // Ekip oluştur veya bul
      let team = await (prisma.team as any).findFirst({
        where: { name: ekip.ad, companyId: company.id },
      });
      if (!team) {
        team = await (prisma.team as any).create({
          data: {
            name: ekip.ad,
            companyId: company.id,
            disciplineId: findDisciplineId(ekip.ad),
            ...(project ? { projectId: project.id } : {}),
          },
        });
        console.log(`    📋 Ekip oluşturuldu: ${ekip.ad}`);
      } else {
        console.log(`    ℹ️  Ekip mevcut: ${ekip.ad}`);
      }

      // Çalışanları oluştur
      for (let i = 0; i < ekip.kisi; i++) {
        let firstName: string, lastName: string, fullName: string;
        // Benzersiz isim
        do {
          firstName = randomItem(erkekAdlari);
          lastName = randomItem(soyadlari);
          fullName = `${firstName} ${lastName}`;
        } while (usedNames.has(fullName));
        usedNames.add(fullName);

        const gorev = randomItem(ekip.gorevler);
        const startDate = new Date(2024, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28));

        await (prisma.worker as any).create({
          data: {
            firstName,
            lastName,
            role: gorev,
            teamId: team.id,
            identityNo: randomTC(),
            phone: randomPhone(),
            bloodType: randomItem(kanGruplari),
            emergencyContact: `${randomItem(erkekAdlari)} ${lastName}`,
            emergencyPhone: randomPhone(),
            isActive: true,
            startDate,
          },
        });
        totalCreated++;
      }
      console.log(`      👷 ${ekip.kisi} çalışan eklendi (${ekip.ad})`);
    }
    console.log("");
  }

  console.log(`\n✅ Toplam ${totalCreated} çalışan başarıyla eklendi!`);
}

main()
  .catch((e) => {
    console.error("❌ Hata:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
