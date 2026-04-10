import { NextRequest, NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { prisma } from "@/lib/prisma";

/* ═══════════════════════════════════════════════════════════
   Hazır İmalat Verileri — Ofis renovasyon projesi standart
   POST /api/projeler/[id]/imalat-takip/seed
   Body: { floorId: string }
   ═══════════════════════════════════════════════════════════ */

type Yer = "DUVAR" | "TAVAN" | "DOSEME" | "DUVAR_TAVAN" | "ALIN_SAKAL" | "GENEL" | "DIGER";
type Durum = "YAPILMADI" | "YAPILIYOR" | "TAMAMLANDI";

interface ImalatItem {
  siraNo: number;
  yer: Yer;
  aciklama: string;
  disiplin: string;
  imalatDurumu: Durum;
}

/* ─── Tüm Mahaller İçin Ortak 36 İş Kalemi ─── */
const ORTAK_KALEMLER: ImalatItem[] = [
  { siraNo: 1,  yer: "DUVAR",       aciklama: "Karkas + Tek yüz kapama",                         disiplin: "İnşaat",   imalatDurumu: "TAMAMLANDI" },
  { siraNo: 2,  yer: "DUVAR",       aciklama: "Elektrik Altyapı + kasa aplikasyonları",           disiplin: "Elektrik", imalatDurumu: "TAMAMLANDI" },
  { siraNo: 3,  yer: "TAVAN",       aciklama: "Elektrik altyapı tüm geçişler",                   disiplin: "Elektrik", imalatDurumu: "TAMAMLANDI" },
  { siraNo: 4,  yer: "TAVAN",       aciklama: "Mekanik altyapı tüm geçişler",                    disiplin: "Mekanik",  imalatDurumu: "TAMAMLANDI" },
  { siraNo: 5,  yer: "DUVAR",       aciklama: "Taş yünü + alçıpan kapama",                       disiplin: "İnşaat",   imalatDurumu: "TAMAMLANDI" },
  { siraNo: 6,  yer: "DUVAR",       aciklama: "Elektrik kasa aplikasyonları",                     disiplin: "Elektrik", imalatDurumu: "TAMAMLANDI" },
  { siraNo: 7,  yer: "DUVAR_TAVAN", aciklama: "Pasif yangın durdurucu",                           disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 8,  yer: "TAVAN",       aciklama: "Slot karkasları",                                  disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 9,  yer: "TAVAN",       aciklama: "Slot kutuları + menfez montajları",                disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 10, yer: "TAVAN",       aciklama: "Müdahale kapağı karkasları",                       disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 11, yer: "ALIN_SAKAL",  aciklama: "Karkas + alçıpan kapama",                          disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 12, yer: "TAVAN",       aciklama: "Karkas",                                           disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 13, yer: "TAVAN",       aciklama: "Sprinkler altyapı montajları",                     disiplin: "Mekanik",  imalatDurumu: "YAPILMADI" },
  { siraNo: 14, yer: "TAVAN",       aciklama: "Elektrik altyapı kontrol",                         disiplin: "Elektrik", imalatDurumu: "YAPILIYOR" },
  { siraNo: 15, yer: "TAVAN",       aciklama: "Mekanik altyapı kontrol ve test",                  disiplin: "Mekanik",  imalatDurumu: "YAPILIYOR" },
  { siraNo: 16, yer: "TAVAN",       aciklama: "Alçıpan kapama",                                   disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 17, yer: "TAVAN",       aciklama: "Elektrik aplikasyon boşluklarının açılması",        disiplin: "Elektrik", imalatDurumu: "YAPILMADI" },
  { siraNo: 18, yer: "TAVAN",       aciklama: "Kapak aplikasyon boşluklarının açılması",           disiplin: "Elektrik", imalatDurumu: "YAPILMADI" },
  { siraNo: 19, yer: "TAVAN",       aciklama: "Saten alçı",                                       disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 20, yer: "TAVAN",       aciklama: "Boya",                                             disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 21, yer: "ALIN_SAKAL",  aciklama: "Saten alçı (Duvar + Alın + Sakal)",                disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 22, yer: "DUVAR_TAVAN", aciklama: "1.kat boya",                                       disiplin: "İnşaat",   imalatDurumu: "TAMAMLANDI" },
  { siraNo: 23, yer: "TAVAN",       aciklama: "Elektrik ürünleri montajlar",                      disiplin: "Elektrik", imalatDurumu: "YAPILMADI" },
  { siraNo: 24, yer: "DOSEME",      aciklama: "Elektrik altyapı",                                 disiplin: "Elektrik", imalatDurumu: "YAPILMADI" },
  { siraNo: 25, yer: "DOSEME",      aciklama: "Yükseltilmiş döşeme montajı",                      disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 26, yer: "DOSEME",      aciklama: "Halı",                                             disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 27, yer: "DUVAR",       aciklama: "Mobilya montajları",                               disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 28, yer: "DUVAR",       aciklama: "Süpürgelik montajları",                            disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 29, yer: "DUVAR",       aciklama: "Cam bölme montajları",                             disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 30, yer: "DUVAR",       aciklama: "Elektrik ürünleri montajlar",                      disiplin: "Elektrik", imalatDurumu: "YAPILMADI" },
  { siraNo: 31, yer: "DUVAR_TAVAN", aciklama: "2.kat boya sonlama",                               disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 32, yer: "DOSEME",      aciklama: "Hareketli mobilya montajları",                     disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 33, yer: "DOSEME",      aciklama: "Masa elektrik bağlantıları",                       disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
  { siraNo: 34, yer: "GENEL",       aciklama: "Elektrik test ve devriye alma",                    disiplin: "Elektrik", imalatDurumu: "YAPILMADI" },
  { siraNo: 35, yer: "GENEL",       aciklama: "Mekanik test ve devriye alma",                     disiplin: "Mekanik",  imalatDurumu: "YAPILMADI" },
  { siraNo: 36, yer: "GENEL",       aciklama: "İnce işler teslimi",                               disiplin: "İnşaat",   imalatDurumu: "YAPILMADI" },
];

/* ─── 14 Mahal Tanımı ─── */
const MAHAL_ISIMLERI = [
  "Giriş Koridor",
  "Sosyal Alan",
  "Dairesel Cam Toplantı Odası",
  "Görüşme Odası 1",
  "Görüşme Odası 2",
  "Mesh Tavan Alanı",
  "Açık Ofis",
  "DİREKTÖR ALANLARI",
  "MUTFAK",
  "ISLAK HACİMLER",
  "FOTOKOPİ ODASI",
  "ELEKTRİK ODASI",
  "MEKANİK PROJE",
  "YANGIN GÜVENLİK HOLÜ",
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  try {
    const body = await req.json();
    const { floorId } = body;

    if (!floorId) {
      return NextResponse.json({ error: "Kat seçimi zorunludur" }, { status: 400 });
    }

    // Proje kontrolü
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
    }

    // Kat kontrolü
    const floor = await prisma.floor.findUnique({ where: { id: floorId } });
    if (!floor) {
      return NextResponse.json({ error: "Kat bulunamadı" }, { status: 404 });
    }

    // Disiplinleri çek
    const disciplines = await prisma.discipline.findMany();
    const discMap = new Map(disciplines.map((d: any) => [d.name, d.id]));

    // Eksik disiplinleri oluştur
    const requiredDiscs = ["İnşaat", "Elektrik", "Mekanik"];
    for (const name of requiredDiscs) {
      if (!discMap.has(name)) {
        const created = await prisma.discipline.create({ data: { name } });
        discMap.set(name, created.id);
      }
    }

    // Mevcut verileri temizle (bu proje + bu kat)
    await prisma.imalatKalemi.deleteMany({
      where: { imalatMahal: { projectId, floorId } },
    });
    await prisma.imalatMahal.deleteMany({
      where: { projectId, floorId },
    });

    // Mahalleri ve kalemleri oluştur
    let totalKalem = 0;
    const createdMahaller = [];

    for (let i = 0; i < MAHAL_ISIMLERI.length; i++) {
      const mahalName = MAHAL_ISIMLERI[i];

      const mahal = await prisma.imalatMahal.create({
        data: {
          projectId,
          floorId,
          name: mahalName,
          sortOrder: i + 1,
        },
      });

      const kalemData = ORTAK_KALEMLER.map((item) => ({
        imalatMahalId: mahal.id,
        siraNo: item.siraNo,
        imalatAciklama: item.aciklama,
        yer: item.yer as any,
        disciplineId: discMap.get(item.disiplin) || null,
        projeDurumu: "GECERLI" as any,
        imalatDurumu: item.imalatDurumu as any,
      }));

      await prisma.imalatKalemi.createMany({ data: kalemData });
      totalKalem += kalemData.length;
      createdMahaller.push({ name: mahalName, kalemCount: kalemData.length });
    }

    // Şablonları da oluştur (mevcut olmayanları)
    const existingSablonlar = await prisma.imalatSablon.findMany({
      where: { projectId },
      select: { aciklama: true, yer: true },
    });
    const existingKeys = new Set(existingSablonlar.map((s: any) => `${s.aciklama}|${s.yer}`));

    const uniqueItems = new Map<string, { aciklama: string; yer: string; disiplin: string }>();
    for (const item of ORTAK_KALEMLER) {
      const key = `${item.aciklama}|${item.yer}`;
      if (!existingKeys.has(key) && !uniqueItems.has(key)) {
        uniqueItems.set(key, { aciklama: item.aciklama, yer: item.yer, disiplin: item.disiplin });
      }
    }

    if (uniqueItems.size > 0) {
      const sablonData = Array.from(uniqueItems.values()).map((item, idx) => ({
        projectId,
        aciklama: item.aciklama,
        yer: item.yer as any,
        disiplinAdi: item.disiplin,
        varsayilanSira: idx + 1,
      }));
      await prisma.imalatSablon.createMany({ data: sablonData });
    }

    return NextResponse.json({
      success: true,
      mahalCount: MAHAL_ISIMLERI.length,
      kalemCount: totalKalem,
      sablonCount: uniqueItems.size,
      mahaller: createdMahaller,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Seed verisi yüklenemedi:", error);
    const message = error?.message || "Seed verisi yüklenemedi";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
