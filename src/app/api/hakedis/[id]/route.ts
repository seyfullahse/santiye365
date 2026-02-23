import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Tek hakediş detay
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hakedis = await prisma.hakedis.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        items: { orderBy: { pozNo: "asc" } },
      },
    });

    if (!hakedis) {
      return NextResponse.json({ error: "Hakediş bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(hakedis);
  } catch (error) {
    console.error("Hakediş detay hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PUT — Hakediş güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      period,
      startDate,
      endDate,
      notes,
      status,
      items,
      advanceDeduction,
      retentionRate,
      stampTax,
      otherDeduction,
    } = body;

    // Mevcut hakedişi al
    const existing = await prisma.hakedis.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Hakediş bulunamadı" }, { status: 404 });
    }

    // Eğer items gönderildiyse güncelle
    let currentAmount = existing.currentAmount;
    let totalAmount = existing.totalAmount;

    if (items) {
      // Mevcut kalemleri sil
      await prisma.hakedisItem.deleteMany({ where: { hakedisId: id } });

      const processedItems = items.map((item: {
        pozNo: string;
        description: string;
        unit: string;
        contractQty: number;
        unitPrice: number;
        previousQty: number;
        currentQty: number;
      }) => {
        const cumulativeQty = (item.previousQty || 0) + (item.currentQty || 0);
        const amount = (item.currentQty || 0) * (item.unitPrice || 0);
        return {
          hakedisId: id,
          pozNo: item.pozNo,
          description: item.description,
          unit: item.unit,
          contractQty: item.contractQty || 0,
          unitPrice: item.unitPrice || 0,
          previousQty: item.previousQty || 0,
          currentQty: item.currentQty || 0,
          cumulativeQty,
          amount,
        };
      });

      await prisma.hakedisItem.createMany({ data: processedItems });

      currentAmount = processedItems.reduce(
        (sum: number, i: { amount: number }) => sum + i.amount,
        0
      );
      totalAmount = existing.previousAmount + currentAmount;
    }

    const rate = retentionRate ?? existing.retentionRate;
    const retentionAmount = totalAmount * (rate / 100);
    const advance = advanceDeduction ?? existing.advanceDeduction;
    const stamp = stampTax ?? existing.stampTax;
    const other = otherDeduction ?? existing.otherDeduction;
    const netAmount = currentAmount - advance - retentionAmount - stamp - other;

    const updated = await prisma.hakedis.update({
      where: { id },
      data: {
        ...(period && { period }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
        currentAmount,
        totalAmount,
        advanceDeduction: advance,
        retentionRate: rate,
        retentionAmount,
        stampTax: stamp,
        otherDeduction: other,
        netAmount,
      },
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        items: { orderBy: { pozNo: "asc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Hakediş güncelleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE — Hakediş sil
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.hakedis.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hakediş silme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
