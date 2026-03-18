import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * İnşaat sektörü İSG eğitim tanımları - standart set
 * Mevzuata uygun, role göre atanmak üzere hazırlanmış
 */
const SEED_DEFINITIONS = [
  // ═══════════════════════════════════
  // İSG - Tüm Çalışanlar İçin Zorunlu
  // ═══════════════════════════════════
  {
    name: "Temel İSG Eğitimi",
    description: "İnşaat sektörü zorunlu İSG eğitimi. İçerik: Riskler, acil durumlar, KKD kullanımı, iş kazası ve önleme. En az 16 saat.",
    durationHours: 16,
    isMandatory: true,
    validityMonths: 12,
    category: "ISG",
  },
  {
    name: "KKD Kullanım Eğitimi",
    description: "Kişisel Koruyucu Donanım kullanımı: Baret, çelik burunlu ayakkabı, reflektörlü yelek, eldiven, gözlük, emniyet kemeri. Zimmet prosedürü dahil.",
    durationHours: 2,
    isMandatory: true,
    validityMonths: 12,
    category: "ISG",
  },
  {
    name: "Yangın Güvenliği ve Tahliye Eğitimi",
    description: "Uygulamalı yangın eğitimi, tahliye tatbikatı, yangın söndürücü kullanımı, toplanma noktaları.",
    durationHours: 4,
    isMandatory: true,
    validityMonths: 12,
    category: "ISG",
  },
  {
    name: "Acil Durum ve İlk Yardım Eğitimi",
    description: "Acil durum prosedürleri, ilk yardım temel uygulamaları, kaza anında müdahale. Yeterli sayıda sertifikalı personel bulundurma yükümlülüğü.",
    durationHours: 4,
    isMandatory: true,
    validityMonths: 12,
    category: "ISG",
  },
  {
    name: "İş Kazası ve Önleme Eğitimi",
    description: "İş kazası türleri, kök neden analizi, düzeltici faaliyetler, SGK bildirimi (3 iş günü), kaza tutanağı hazırlama.",
    durationHours: 2,
    isMandatory: true,
    validityMonths: 12,
    category: "ISG",
  },
  {
    name: "Risk Değerlendirmesi Eğitimi",
    description: "Risk analizi yöntemleri, risk analizi tebliği, tehlike sınıflandırması, tehlike bildirme yükümlülüğü, ramak kala bildirim sistemi.",
    durationHours: 4,
    isMandatory: true,
    validityMonths: 12,
    category: "ISG",
  },

  // ═══════════════════════════════════
  // İSG - Saha / Şantiye Çalışanları
  // ═══════════════════════════════════
  {
    name: "Yüksekte Çalışma Eğitimi",
    description: "Emniyet kemeri kullanımı, düşme durdurma sistemleri, iskele güvenliği. Yüksekte çalışma izin formu prosedürü dahil.",
    durationHours: 8,
    isMandatory: true,
    validityMonths: 12,
    category: "ISG",
  },
  {
    name: "Kapalı Alan Çalışma Eğitimi",
    description: "Confined space güvenliği, gaz ölçüm cihazları, havalandırma, kurtarma prosedürleri. Kapalı alan çalışma izni prosedürü dahil.",
    durationHours: 8,
    isMandatory: true,
    validityMonths: 12,
    category: "ISG",
  },
  {
    name: "Elektrik Güvenliği Eğitimi",
    description: "Elektrik çarpma riskleri, kilitleme/etiketleme (LOTO), güvenli çalışma mesafeleri, topraklama.",
    durationHours: 4,
    isMandatory: true,
    validityMonths: 12,
    category: "ISG",
  },
  {
    name: "Sıcak İş (Kaynak vb.) Güvenlik Eğitimi",
    description: "Kaynak, kesme ve taşlama güvenliği. Sıcak iş izni prosedürü, yangın gözcüsü uygulaması.",
    durationHours: 4,
    isMandatory: true,
    validityMonths: 12,
    category: "ISG",
  },

  // ═══════════════════════════════════
  // İSG - Ofis Çalışanları
  // ═══════════════════════════════════
  {
    name: "Ergonomi Eğitimi",
    description: "Ofis ergonomisi, doğru oturuş pozisyonu, ekran kullanımı, tekrarlayan hareket yaralanmaları (RSI) önleme.",
    durationHours: 2,
    isMandatory: false,
    validityMonths: 24,
    category: "ISG",
  },

  // ═══════════════════════════════════
  // İSG - Saha Güvenlik Uygulamaları
  // ═══════════════════════════════════
  {
    name: "Toolbox Talk (Günlük Saha Eğitimi)",
    description: "Günlük/haftalık kısa saha güvenlik eğitimleri, günlük risk değerlendirmesi, ekipman kontrolleri.",
    durationHours: 1,
    isMandatory: false,
    validityMonths: null,
    category: "ISG",
  },
  {
    name: "İskele Kontrol ve Güvenlik Eğitimi",
    description: "İskele kontrol formları, günlük iskele kontrolleri, yük kapasiteleri, korkuluk sistemleri.",
    durationHours: 4,
    isMandatory: true,
    validityMonths: 12,
    category: "ISG",
  },

  // ═══════════════════════════════════
  // ORIENTATION - İşbaşı Eğitimleri
  // ═══════════════════════════════════
  {
    name: "İşe Özel (İşbaşı) Eğitimi",
    description: "Çalışacağı işin riskleri, sahaya özel kurallar, ekipman kullanımı, iş izin prosedürleri. Her yeni iş/görev değişikliğinde tekrarlanır.",
    durationHours: 4,
    isMandatory: true,
    validityMonths: null,
    category: "ORIENTATION",
  },
  {
    name: "Genel Oryantasyon Eğitimi",
    description: "Şantiye genel tanıtımı, organizasyon yapısı, acil çıkışlar, toplanma alanları, genel kurallar, görev tanımı tebliği.",
    durationHours: 2,
    isMandatory: true,
    validityMonths: null,
    category: "ORIENTATION",
  },

  // ═══════════════════════════════════
  // TECHNICAL - Teknik / Ekipman Eğitimleri
  // ═══════════════════════════════════
  {
    name: "İskele Kurulum / Söküm Eğitimi",
    description: "İskele montaj ve demontaj teknikleri, bağlantı elemanları, yük hesapları, güvenlik kontrol listesi.",
    durationHours: 8,
    isMandatory: true,
    validityMonths: 24,
    category: "TECHNICAL",
  },
  {
    name: "Vinç Operatör Eğitimi",
    description: "Kule vinç / mobil vinç kullanımı, yük kaldırma güvenliği, sinyal işaretleri, bakım kontrolleri.",
    durationHours: 16,
    isMandatory: true,
    validityMonths: 24,
    category: "TECHNICAL",
  },
  {
    name: "Forklift Operatör Eğitimi",
    description: "Forklift kullanımı, yük taşıma güvenliği, manevra teknikleri, günlük kontrol listesi.",
    durationHours: 8,
    isMandatory: true,
    validityMonths: 24,
    category: "TECHNICAL",
  },
  {
    name: "Ağır Ekipman Kullanım Eğitimi",
    description: "Ekskavatör, yükleyici, damperli kamyon vb. ağır iş makineleri kullanımı ve güvenliği.",
    durationHours: 16,
    isMandatory: true,
    validityMonths: 24,
    category: "TECHNICAL",
  },

  // ═══════════════════════════════════
  // PROFESSIONAL - Mesleki Yeterlilik
  // ═══════════════════════════════════
  {
    name: "MYK Mesleki Yeterlilik - Kalıpçı",
    description: "MYK belgesi zorunlu. Kalıp yapım teknikleri, kalıp sistemleri, güvenli kalıp söküm prosedürleri.",
    durationHours: 0,
    isMandatory: true,
    validityMonths: 60,
    category: "PROFESSIONAL",
  },
  {
    name: "MYK Mesleki Yeterlilik - Demirci",
    description: "MYK belgesi zorunlu. Demir bükme/bağlama teknikleri, donatı planı okuma, güvenli çalışma yöntemleri.",
    durationHours: 0,
    isMandatory: true,
    validityMonths: 60,
    category: "PROFESSIONAL",
  },
  {
    name: "MYK Mesleki Yeterlilik - Kaynakçı",
    description: "MYK belgesi zorunlu. Kaynak teknikleri, kaynak güvenliği, koruyucu ekipman kullanımı.",
    durationHours: 0,
    isMandatory: true,
    validityMonths: 60,
    category: "PROFESSIONAL",
  },
  {
    name: "MYK Mesleki Yeterlilik - Elektrikçi",
    description: "MYK belgesi zorunlu. Elektrik tesisatı, pano montajı, topraklama, güvenli çalışma prosedürleri.",
    durationHours: 0,
    isMandatory: true,
    validityMonths: 60,
    category: "PROFESSIONAL",
  },
  {
    name: "MYK Mesleki Yeterlilik - Boyacı/Sıvacı",
    description: "MYK belgesi. Boya ve sıva uygulama teknikleri, malzeme güvenliği, yüksekte çalışma kuralları.",
    durationHours: 0,
    isMandatory: false,
    validityMonths: 60,
    category: "PROFESSIONAL",
  },
  {
    name: "MYK Mesleki Yeterlilik - Tesisatçı",
    description: "MYK belgesi. Su ve doğalgaz tesisatı, basınç testleri, sızdırmazlık kontrolleri.",
    durationHours: 0,
    isMandatory: false,
    validityMonths: 60,
    category: "PROFESSIONAL",
  },
];

/**
 * POST - Standart İSG eğitim tanımlarını veritabanına aktar
 * Mevcut aynı isimdeki tanımları atlar (duplicate'leri önler)
 */
export async function POST() {
  try {
    // Mevcut tanımları al (isim bazında duplicate kontrolü)
    const existing = await prisma.trainingDefinition.findMany({
      select: { name: true },
    });
    const existingNames = new Set(existing.map((e: { name: string }) => e.name.toLowerCase().trim()));

    const toCreate = SEED_DEFINITIONS.filter(
      (d) => !existingNames.has(d.name.toLowerCase().trim())
    );
    const skipped = SEED_DEFINITIONS.length - toCreate.length;

    if (toCreate.length > 0) {
      await prisma.trainingDefinition.createMany({
        data: toCreate.map((d) => ({
          name: d.name,
          description: d.description,
          durationHours: d.durationHours,
          isMandatory: d.isMandatory,
          validityMonths: d.validityMonths,
          category: d.category as "ISG" | "TECHNICAL" | "PROFESSIONAL" | "ORIENTATION",
        })),
      });
    }

    return NextResponse.json({
      message: "Standart eğitim tanımları içe aktarıldı",
      created: toCreate.length,
      skipped,
      total: SEED_DEFINITIONS.length,
      details: {
        isg: toCreate.filter((d) => d.category === "ISG").length,
        technical: toCreate.filter((d) => d.category === "TECHNICAL").length,
        professional: toCreate.filter((d) => d.category === "PROFESSIONAL").length,
        orientation: toCreate.filter((d) => d.category === "ORIENTATION").length,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "İçe aktarma başarısız" }, { status: 500 });
  }
}
