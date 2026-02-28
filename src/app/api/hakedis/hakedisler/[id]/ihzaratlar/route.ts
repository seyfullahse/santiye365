import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET — Hakediş'e ait ihzaratları listele
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ihzaratlar = await prisma.ihzarat.findMany({
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

    return NextResponse.json(ihzaratlar);
  } catch (error) {
    console.error("İhzarat listesi hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST — Hakediş'e yeni ihzarat ekle
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { aciklama, tarih, kalemler } = body;

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
    const count = await prisma.ihzarat.count({
      where: { hakedisId: id },
    });
    const ihzaratNo = `İHZ-${String(count + 1).padStart(3, "0")}`;

    const ihzarat = await prisma.ihzarat.create({
      data: {
        contractId: hakedis.contractId,
        hakedisId: id,
        ihzaratNo,
        aciklama: aciklama || null,
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

    // ─── Hakediş tutarlarını ihzarat verisinden yeniden hesapla ───
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

    return NextResponse.json(ihzarat, { status: 201 });
  } catch (error) {
    console.error("İhzarat oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE — İhzarat sil
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // hakediş id (kullanılmıyor, doğrulama için)
    const { searchParams } = new URL(req.url);
    const ihzaratId = searchParams.get("ihzaratId");

    if (!ihzaratId) {
      return NextResponse.json(
        { error: "ihzaratId parametresi zorunludur" },
        { status: 400 }
      );
    }

    await prisma.ihzarat.delete({ where: { id: ihzaratId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("İhzarat silme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
