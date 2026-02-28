import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * GET /api/hakedis/hakedisler/[id]/toplamlar
 * 
 * Kümülatif Yeşil Defter + İhzarat Mahsubu + İcmal hesaplaması
 * 
 * Yeşil Defter: HAK-1'den HAK-N'ye kadar tüm ataşmanları kümülatif toplar
 * İhzarat Mahsubu: min(kümülatif_imalat, kümülatif_ihzarat) × malzemeFiyatı - önceki mahsup
 * İcmal: Yeşil Defter toplamı - İhzarat Mahsubu + İhzarat (bu dönem) - Kesintiler = Net
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Hakediş bilgisini al
    const hakedis = await prisma.hakedis.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            items: true, // Tüm keşif kalemleri
          },
        },
      },
    });

    if (!hakedis || !hakedis.contractId) {
      return NextResponse.json(
        { error: "Hakediş veya sözleşme bulunamadı" },
        { status: 404 }
      );
    }

    // Bu sözleşmeye ait, bu hakediş no'ya kadar olan tüm hakedişleri al
    const allHakedisler = await prisma.hakedis.findMany({
      where: {
        contractId: hakedis.contractId,
        no: { lte: hakedis.no },
      },
      include: {
        atasmanlar: {
          include: {
            kalemler: true,
          },
        },
        ihzaratlar: {
          include: {
            kalemler: true,
          },
        },
      },
      orderBy: { no: "asc" },
    });

    // Önceki hakedişler (bu hariç)
    const oncekiHakedisler = allHakedisler.filter((h) => h.no < hakedis.no);
    // Bu hakediş
    const buHakedis = allHakedisler.find((h) => h.id === id);

    if (!buHakedis) {
      return NextResponse.json(
        { error: "Hakediş bulunamadı" },
        { status: 404 }
      );
    }

    const kesifKalemleri = hakedis.contract!.items;

    // ─── YEŞİL DEFTER HESAPLAMA ─────────────────────────
    // Her keşif kalemi için kümülatif ataşman toplamı
    const yesilDefter = kesifKalemleri.map((kesif) => {
      // Bu hakediş dahil tüm ataşman miktarları
      let kumulatifMiktar = 0;
      let oncekiMiktar = 0;
      let buDonemMiktar = 0;

      allHakedisler.forEach((h) => {
        const atasmanMiktar = h.atasmanlar.reduce((sum, a) => {
          return (
            sum +
            a.kalemler
              .filter((k) => k.kesifKalemiId === kesif.id)
              .reduce((s, k) => s + k.miktar, 0)
          );
        }, 0);

        kumulatifMiktar += atasmanMiktar;
        if (h.no < hakedis.no) {
          oncekiMiktar += atasmanMiktar;
        } else {
          buDonemMiktar += atasmanMiktar;
        }
      });

      const toplamBirimFiyat = kesif.toplamBirimFiyat || 0;
      const kumulatifTutar = kumulatifMiktar * toplamBirimFiyat;
      const oncekiTutar = oncekiMiktar * toplamBirimFiyat;
      const buDonemTutar = buDonemMiktar * toplamBirimFiyat;

      return {
        kesifKalemiId: kesif.id,
        pozNo: kesif.pozNo,
        description: kesif.description,
        unit: kesif.unit,
        birimFiyat: toplamBirimFiyat,
        malzemeFiyati: kesif.malzemeFiyati,
        iscilikFiyati: kesif.iscilikFiyati,
        sozlesmeMiktar: kesif.quantity,
        oncekiMiktar,
        buDonemMiktar,
        kumulatifMiktar,
        oncekiTutar,
        buDonemTutar,
        kumulatifTutar,
      };
    });

    // ─── İHZARAT HESAPLAMA ──────────────────────────────
    // Her keşif kalemi için kümülatif ihzarat miktarı
    const ihzaratHesap = kesifKalemleri.map((kesif) => {
      let kumulatifIhzarat = 0;
      let oncekiIhzarat = 0;
      let buDonemIhzarat = 0;

      allHakedisler.forEach((h) => {
        const ihzMiktar = h.ihzaratlar.reduce((sum, ihz) => {
          return (
            sum +
            ihz.kalemler
              .filter((k) => k.kesifKalemiId === kesif.id)
              .reduce((s, k) => s + k.miktar, 0)
          );
        }, 0);

        kumulatifIhzarat += ihzMiktar;
        if (h.no < hakedis.no) {
          oncekiIhzarat += ihzMiktar;
        } else {
          buDonemIhzarat += ihzMiktar;
        }
      });

      const malzemeFiyati = kesif.malzemeFiyati || 0;
      const kumulatifIhzaratTutar = kumulatifIhzarat * malzemeFiyati;
      const oncekiIhzaratTutar = oncekiIhzarat * malzemeFiyati;
      const buDonemIhzaratTutar = buDonemIhzarat * malzemeFiyati;

      return {
        kesifKalemiId: kesif.id,
        pozNo: kesif.pozNo,
        description: kesif.description,
        unit: kesif.unit,
        malzemeFiyati,
        oncekiIhzarat,
        buDonemIhzarat,
        kumulatifIhzarat,
        oncekiIhzaratTutar,
        buDonemIhzaratTutar,
        kumulatifIhzaratTutar,
      };
    });

    // ─── İHZARAT MAHSUBU HESAPLAMA ──────────────────────
    // İhzarat Mahsubu: İmalat yapıldığında, daha önce ihzarat olarak ödenen malzeme bedelinin düşülmesi
    // min(kümülatif_imalat, kümülatif_ihzarat) × malzemeFiyatı - önceki_mahsup
    const ihzaratMahsubu = kesifKalemleri.map((kesif) => {
      const yd = yesilDefter.find((y) => y.kesifKalemiId === kesif.id);
      const ihz = ihzaratHesap.find((i) => i.kesifKalemiId === kesif.id);

      if (!yd || !ihz) {
        return {
          kesifKalemiId: kesif.id,
          pozNo: kesif.pozNo,
          description: kesif.description,
          unit: kesif.unit,
          malzemeFiyati: kesif.malzemeFiyati,
          kumulatifImalat: 0,
          kumulatifIhzarat: 0,
          mahsupMiktar: 0,
          oncekiMahsupMiktar: 0,
          buDonemMahsupMiktar: 0,
          mahsupTutar: 0,
          oncekiMahsupTutar: 0,
          buDonemMahsupTutar: 0,
        };
      }

      const malzemeFiyati = kesif.malzemeFiyati || 0;

      // Kümülatif mahsup miktarı = min(kümülatif imalat, kümülatif ihzarat)
      const kumulatifMahsupMiktar = Math.min(
        yd.kumulatifMiktar,
        ihz.kumulatifIhzarat
      );
      const kumulatifMahsupTutar = kumulatifMahsupMiktar * malzemeFiyati;

      // Önceki mahsup miktarı = min(önceki imalat, önceki ihzarat)
      const oncekiMahsupMiktar = Math.min(
        yd.oncekiMiktar,
        ihz.oncekiIhzarat
      );
      const oncekiMahsupTutar = oncekiMahsupMiktar * malzemeFiyati;

      // Bu dönem mahsubu
      const buDonemMahsupMiktar = kumulatifMahsupMiktar - oncekiMahsupMiktar;
      const buDonemMahsupTutar = kumulatifMahsupTutar - oncekiMahsupTutar;

      return {
        kesifKalemiId: kesif.id,
        pozNo: kesif.pozNo,
        description: kesif.description,
        unit: kesif.unit,
        malzemeFiyati,
        kumulatifImalat: yd.kumulatifMiktar,
        kumulatifIhzarat: ihz.kumulatifIhzarat,
        mahsupMiktar: kumulatifMahsupMiktar,
        oncekiMahsupMiktar,
        buDonemMahsupMiktar,
        mahsupTutar: kumulatifMahsupTutar,
        oncekiMahsupTutar,
        buDonemMahsupTutar,
      };
    });

    // ─── İCMAL ──────────────────────────────────────────
    const yesilDefterToplam = yesilDefter.reduce(
      (s, y) => s + y.buDonemTutar,
      0
    );
    const yesilDefterKumulatif = yesilDefter.reduce(
      (s, y) => s + y.kumulatifTutar,
      0
    );
    const ihzaratToplam = ihzaratHesap.reduce(
      (s, i) => s + i.buDonemIhzaratTutar,
      0
    );
    const ihzaratKumulatif = ihzaratHesap.reduce(
      (s, i) => s + i.kumulatifIhzaratTutar,
      0
    );
    const mahsupToplam = ihzaratMahsubu.reduce(
      (s, m) => s + m.buDonemMahsupTutar,
      0
    );
    const mahsupKumulatif = ihzaratMahsubu.reduce(
      (s, m) => s + m.mahsupTutar,
      0
    );

    // İcmal: İmalat + İhzarat - İhzarat Mahsubu = Brüt
    // Brüt - Kesintiler = Net
    const brutTutar = yesilDefterToplam + ihzaratToplam - mahsupToplam;

    // ─── KESİNTİ OTOMASYONU ─────────────────────────────
    // Sözleşmedeki avans oranı ve teminat oranı üzerinden otomatik hesaplama
    const contract = hakedis.contract!;
    const avansOrani = contract.advanceRate ?? 0;   // %
    const teminatOrani = contract.retentionRate ?? 0; // %

    // Avans kesintisi: brüt tutar × avans oranı / 100
    const avansKesintisi = brutTutar * (avansOrani / 100);
    // Teminat kesintisi: brüt tutar × teminat oranı / 100
    const teminatKesintisi = brutTutar * (teminatOrani / 100);
    // Damga vergisi: brüt tutar × 0.00948 (binde 9,48)
    const damgaVergisi = brutTutar * 0.00948;
    // Diğer kesintiler: hakedişte elle girilmiş ek kesintiler
    const digerKesintiler = hakedis.otherDeduction ?? 0;

    const toplamKesinti = avansKesintisi + teminatKesintisi + damgaVergisi + digerKesintiler;

    const kesintiler = {
      avansKesintisi,
      teminatKesintisi,
      damgaVergisi,
      digerKesintiler,
      toplamKesinti,
    };
    const netTutar = brutTutar - toplamKesinti;

    const icmal = {
      yesilDefterToplam,
      yesilDefterKumulatif,
      ihzaratToplam,
      ihzaratKumulatif,
      mahsupToplam,
      mahsupKumulatif,
      brutTutar,
      kesintiler,
      netTutar,
    };

    // ─── HAKEDİŞ TUTARLARINI DB'YE KAYDET ──────────────
    const oncekiKumulatif = yesilDefter.reduce((s, y) => s + y.oncekiTutar, 0)
      + ihzaratHesap.reduce((s, i) => s + i.oncekiIhzaratTutar, 0)
      - ihzaratMahsubu.reduce((s, m) => s + m.oncekiMahsupTutar, 0);

    await prisma.hakedis.update({
      where: { id },
      data: {
        currentAmount: brutTutar,
        previousAmount: oncekiKumulatif,
        totalAmount: oncekiKumulatif + brutTutar,
        advanceDeduction: avansKesintisi,
        retentionRate: teminatOrani,
        retentionAmount: teminatKesintisi,
        stampTax: damgaVergisi,
        netAmount: netTutar,
      },
    });

    return NextResponse.json({
      hakedisNo: hakedis.no,
      period: hakedis.period,
      status: hakedis.status,
      yesilDefter,
      ihzaratHesap,
      ihzaratMahsubu,
      icmal,
    });
  } catch (error) {
    console.error("Toplamlar hesaplama hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
