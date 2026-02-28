import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET — Hakediş'e ait ataşmanları listele
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const atasmanlar = await prisma.atasman.findMany({
      where: { hakedisId: id },
      include: {
        kalemler: {
          include: {
            kesifKalemi: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(atasmanlar);
  } catch (error) {
    console.error("Ataşman listesi hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST — Hakediş'e yeni ataşman ekle
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { aciklama, katBolge, tarih, kalemler } = body;

    // Hakediş'i kontrol et
    const hakedis = await prisma.hakedis.findUnique({
      where: { id },
    });

    if (!hakedis || !hakedis.contractId) {
      return NextResponse.json(
        { error: "Hakediş veya sözleşme bulunamadı" },
        { status: 404 }
      );
    }

    // Sıralı numara
    const count = await prisma.atasman.count({
      where: { hakedisId: id },
    });
    const atasmanNo = `ATŞ-${String(count + 1).padStart(3, "0")}`;

    const atasman = await prisma.atasman.create({
      data: {
        contractId: hakedis.contractId,
        hakedisId: id,
        atasmanNo,
        aciklama: aciklama || null,
        katBolge: katBolge || null,
        tarih: tarih ? new Date(tarih) : null,
        kalemler: {
          create: (kalemler || []).map(
            (k: { kesifKalemiId: string; miktar: number; aciklama?: string }) => ({
              kesifKalemiId: k.kesifKalemiId,
              miktar: k.miktar || 0,
              aciklama: k.aciklama || null,
            })
          ),
        },
      },
      include: {
        kalemler: {
          include: {
            kesifKalemi: true,
          },
        },
      },
    });

    // ─── Hakediş tutarlarını ataşman verisinden yeniden hesapla ───
    try {
      const allHakedisler = await prisma.hakedis.findMany({
        where: { contractId: hakedis.contractId! },
        include: {
          atasmanlar: {
            include: { kalemler: { include: { kesifKalemi: true } } },
          },
          ihzaratlar: {
            include: { kalemler: { include: { kesifKalemi: true } } },
          },
        },
        orderBy: { no: "asc" },
      });

      let runningTotal = 0;
      for (const h of allHakedisler) {
        let imalatTutar = 0;
        for (const a of h.atasmanlar) {
          for (const k of a.kalemler) {
            const birimFiyat = (k.kesifKalemi as any)?.toplamBirimFiyat ?? 0;
            imalatTutar += k.miktar * birimFiyat;
          }
        }
        let ihzaratTutar = 0;
        for (const ihz of h.ihzaratlar) {
          for (const k of ihz.kalemler) {
            const malzemeFiyati = (k.kesifKalemi as any)?.malzemeFiyati ?? 0;
            ihzaratTutar += k.miktar * malzemeFiyati;
          }
        }
        const currentAmount = imalatTutar + ihzaratTutar;
        const previousAmount = runningTotal;
        const totalAmount = previousAmount + currentAmount;
        const toplamKesinti = h.advanceDeduction + h.retentionAmount + h.stampTax + h.otherDeduction;
        const netAmount = totalAmount - toplamKesinti;

        await prisma.hakedis.update({
          where: { id: h.id },
          data: { currentAmount, previousAmount, totalAmount, netAmount },
        });
        runningTotal = totalAmount;
      }
    } catch (err) {
      console.error("Hakediş tutarları güncellenemedi:", err);
    }

    return NextResponse.json(atasman, { status: 201 });
  } catch (error) {
    console.error("Ataşman oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
