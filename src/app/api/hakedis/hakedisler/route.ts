import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Bir sözleşmeye ait tüm hakedişlerin tutarlarını ataşman verilerinden hesaplar.
 * Yeşil defter mantığı: her ataşman kalemi × keşif birim fiyat
 * Kümülatif olarak çalışır: her hakediş önceki toplamı devralır
 */
async function computeHakedisAmounts(contractId: string) {
  // 1. Sözleşmeye ait tüm hakedişleri ataşman + ihzarat + keşif ile birlikte çek
  const hakedisler = await prisma.hakedis.findMany({
    where: { contractId },
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

  const results: { id: string; currentAmount: number; previousAmount: number; totalAmount: number; netAmount: number }[] = [];

  for (const h of hakedisler) {
    // Yeşil defter: ataşman miktarları × keşif birim fiyat
    let imalatTutar = 0;
    for (const atasman of h.atasmanlar) {
      for (const kalem of atasman.kalemler) {
        const birimFiyat = (kalem.kesifKalemi as any)?.toplamBirimFiyat ?? 0;
        imalatTutar += kalem.miktar * birimFiyat;
      }
    }

    // İhzarat toplamı
    let ihzaratTutar = 0;
    for (const ihzarat of h.ihzaratlar) {
      for (const kalem of ihzarat.kalemler) {
        const malzemeFiyati = (kalem.kesifKalemi as any)?.malzemeFiyati ?? 0;
        ihzaratTutar += kalem.miktar * malzemeFiyati;
      }
    }

    const currentAmount = imalatTutar + ihzaratTutar;
    const previousAmount = runningTotal;
    const totalAmount = previousAmount + currentAmount;

    // Kesintiler
    const toplamKesinti =
      h.advanceDeduction + h.retentionAmount + h.stampTax + h.otherDeduction;
    const netAmount = totalAmount - toplamKesinti;

    results.push({ id: h.id, currentAmount, previousAmount, totalAmount, netAmount });
    runningTotal = totalAmount;
  }

  return results;
}

// GET — Sözleşmeye ait hakedişleri listele (tutarlar hesaplanmış olarak)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractId = searchParams.get("contractId");
    const type = searchParams.get("type") as "ISVEREN" | "TASERON" | null;

    const where: Record<string, unknown> = {};
    if (contractId) where.contractId = contractId;
    if (type) where.type = type;

    const hakedisler = await prisma.hakedis.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        contract: { select: { id: true, name: true, contractNo: true } },
        _count: {
          select: {
            atasmanlar: true,
            ihzaratlar: true,
          },
        },
      },
      orderBy: { no: "asc" },
    });

    // Eğer sözleşme bazlı sorgulanıyorsa, tutarları ataşman verisinden hesapla
    if (contractId) {
      const computed = await computeHakedisAmounts(contractId);
      const amountMap = new Map(computed.map((c) => [c.id, c]));

      const enriched = hakedisler.map((h) => {
        const amounts = amountMap.get(h.id);
        if (amounts) {
          return {
            ...h,
            currentAmount: amounts.currentAmount,
            previousAmount: amounts.previousAmount,
            totalAmount: amounts.totalAmount,
            netAmount: amounts.netAmount,
          };
        }
        return h;
      });

      // Arka planda DB'ye de kaydet (await etmeye gerek yok, fire-and-forget)
      Promise.all(
        computed.map((c) =>
          prisma.hakedis.update({
            where: { id: c.id },
            data: {
              currentAmount: c.currentAmount,
              previousAmount: c.previousAmount,
              totalAmount: c.totalAmount,
              netAmount: c.netAmount,
            },
          })
        )
      ).catch((err) => console.error("Hakediş tutarları güncellenemedi:", err));

      return NextResponse.json(enriched);
    }

    return NextResponse.json(hakedisler);
  } catch (error) {
    console.error("Hakediş listesi hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST — Yeni hakediş oluştur (sıralı no ile)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractId, period, startDate, endDate, notes } = body;

    if (!contractId) {
      return NextResponse.json(
        { error: "Sözleşme ID zorunludur" },
        { status: 400 }
      );
    }

    // Sözleşmeyi al (project, company, type bilgisi için)
    const contract = await prisma.hakedisContract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return NextResponse.json(
        { error: "Sözleşme bulunamadı" },
        { status: 404 }
      );
    }

    // Son hakediş numarasını bul → yeni no = son + 1
    const lastHakedis = await prisma.hakedis.findFirst({
      where: { contractId },
      orderBy: { no: "desc" },
    });

    const newNo = (lastHakedis?.no ?? 0) + 1;

    // Önceki kümülatif toplam
    const previousAmount = lastHakedis?.totalAmount ?? 0;

    const hakedis = await prisma.hakedis.create({
      data: {
        projectId: contract.projectId,
        companyId: contract.companyId,
        contractId,
        type: contract.type,
        no: newNo,
        period: period || `HAK-${newNo}`,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        previousAmount,
        currentAmount: 0,
        totalAmount: previousAmount,
        netAmount: 0,
        notes: notes || null,
        status: "DRAFT",
      },
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        contract: { select: { id: true, name: true, contractNo: true } },
      },
    });

    return NextResponse.json(hakedis, { status: 201 });
  } catch (error) {
    console.error("Hakediş oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
