import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * İnşaat sektörü standart KKD türleri
 */
const SEED_PPE_TYPES = [
  // Baş Koruma
  { name: "Baret", category: "Baş Koruma", validityDays: 1095 },
  { name: "Baret Vizörü", category: "Baş Koruma", validityDays: 730 },

  // Ayak Koruma
  { name: "Çelik Burunlu Ayakkabı", category: "Ayak Koruma", validityDays: 365 },
  { name: "Çelik Burunlu Çizme", category: "Ayak Koruma", validityDays: 365 },
  { name: "Kaymaz Tabanlı Ayakkabı", category: "Ayak Koruma", validityDays: 365 },

  // Göz ve Yüz Koruma
  { name: "Koruyucu Gözlük", category: "Göz ve Yüz Koruma", validityDays: 365 },
  { name: "Kaynak Maskesi", category: "Göz ve Yüz Koruma", validityDays: 730 },
  { name: "Yüz Siperi", category: "Göz ve Yüz Koruma", validityDays: 730 },

  // El Koruma
  { name: "İş Eldiveni (Genel)", category: "El Koruma", validityDays: 180 },
  { name: "Kaynak Eldiveni", category: "El Koruma", validityDays: 180 },
  { name: "Nitril Eldiven", category: "El Koruma", validityDays: 90 },
  { name: "Kimyasal Eldiven", category: "El Koruma", validityDays: 180 },
  { name: "Kesik Önleyici Eldiven", category: "El Koruma", validityDays: 180 },

  // Vücut Koruma
  { name: "Reflektörlü Yelek", category: "Vücut Koruma", validityDays: 365 },
  { name: "İş Tulumu", category: "Vücut Koruma", validityDays: 365 },
  { name: "Yağmurluk", category: "Vücut Koruma", validityDays: 365 },
  { name: "Soğuk Hava Montu", category: "Vücut Koruma", validityDays: 730 },

  // Yüksekte Çalışma
  { name: "Emniyet Kemeri (Tam Vücut)", category: "Yüksekte Çalışma", validityDays: 1825 },
  { name: "Yaşam Halatı (Lanyard)", category: "Yüksekte Çalışma", validityDays: 1095 },
  { name: "Düşme Durdurma Aparatı", category: "Yüksekte Çalışma", validityDays: 1825 },
  { name: "Karabina / Bağlantı Elemanı", category: "Yüksekte Çalışma", validityDays: 1825 },

  // Solunum Koruma
  { name: "Toz Maskesi (FFP2)", category: "Solunum Koruma", validityDays: 30 },
  { name: "Toz Maskesi (FFP3)", category: "Solunum Koruma", validityDays: 30 },
  { name: "Yarım Yüz Gaz Maskesi", category: "Solunum Koruma", validityDays: 730 },
  { name: "Gaz Maskesi Filtresi", category: "Solunum Koruma", validityDays: 180 },

  // İşitme Koruma
  { name: "Kulak Tıkacı", category: "İşitme Koruma", validityDays: 30 },
  { name: "Kulaklık (Ear Muff)", category: "İşitme Koruma", validityDays: 730 },

  // Diz ve Vücut Koruma
  { name: "Dizlik", category: "Diz Koruma", validityDays: 365 },
  { name: "Bel Desteği / Korse", category: "Vücut Koruma", validityDays: 365 },
];

/**
 * POST - Standart KKD türlerini veritabanına aktar
 * Mevcut aynı isimdeki türleri atlar (duplicate kontrolü)
 */
export async function POST() {
  try {
    const existing = await prisma.pPEType.findMany({
      select: { name: true },
    });
    const existingNames = new Set(existing.map((e: { name: string }) => e.name.toLowerCase().trim()));

    const toCreate = SEED_PPE_TYPES.filter(
      (d) => !existingNames.has(d.name.toLowerCase().trim())
    );
    const skipped = SEED_PPE_TYPES.length - toCreate.length;

    if (toCreate.length > 0) {
      await prisma.pPEType.createMany({
        data: toCreate.map((d) => ({
          name: d.name,
          category: d.category,
          validityDays: d.validityDays,
        })),
      });
    }

    // Kategori bazında özet
    const categoryCount: Record<string, number> = {};
    toCreate.forEach((d) => {
      categoryCount[d.category] = (categoryCount[d.category] || 0) + 1;
    });

    return NextResponse.json({
      message: "Standart KKD türleri içe aktarıldı",
      created: toCreate.length,
      skipped,
      total: SEED_PPE_TYPES.length,
      categories: categoryCount,
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "İçe aktarma başarısız" }, { status: 500 });
  }
}
