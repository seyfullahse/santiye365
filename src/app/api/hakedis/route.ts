import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Hakediş listesi (type, projectId, companyId filtre)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // ISVEREN | TASERON
    const projectId = searchParams.get("projectId");
    const companyId = searchParams.get("companyId");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (projectId) where.projectId = projectId;
    if (companyId) where.companyId = companyId;

    const hakedisler = await prisma.hakedis.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        items: true,
      },
      orderBy: [{ type: "asc" }, { no: "desc" }],
    });

    return NextResponse.json(hakedisler);
  } catch (error) {
    console.error("Hakediş listesi hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST — Yeni hakediş oluştur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      companyId,
      type,
      period,
      startDate,
      endDate,
      notes,
      items,
      advanceDeduction = 0,
      retentionRate = 0,
      stampTax = 0,
      otherDeduction = 0,
    } = body;

    if (!projectId || !type || !period) {
      return NextResponse.json(
        { error: "Proje, tür ve dönem zorunludur" },
        { status: 400 }
      );
    }

    if (type === "TASERON" && !companyId) {
      return NextResponse.json(
        { error: "Taşeron hakedişi için firma seçimi zorunludur" },
        { status: 400 }
      );
    }

    // Sıralı numara hesapla
    const lastHakedis = await prisma.hakedis.findFirst({
      where: {
        projectId,
        type,
        ...(type === "TASERON" ? { companyId } : {}),
      },
      orderBy: { no: "desc" },
    });
    const nextNo = (lastHakedis?.no ?? 0) + 1;

    // Önceki hakediş toplam tutarı
    const previousAmount = lastHakedis?.totalAmount ?? 0;

    // Kalemleri hesapla
    const processedItems = (items || []).map((item: {
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

    const currentAmount = processedItems.reduce(
      (sum: number, i: { amount: number }) => sum + i.amount,
      0
    );
    const totalAmount = previousAmount + currentAmount;
    const retentionAmount = totalAmount * ((retentionRate || 0) / 100);
    const netAmount =
      currentAmount -
      (advanceDeduction || 0) -
      retentionAmount -
      (stampTax || 0) -
      (otherDeduction || 0);

    const hakedis = await prisma.hakedis.create({
      data: {
        projectId,
        companyId: type === "TASERON" ? companyId : null,
        type,
        no: nextNo,
        period,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        totalAmount,
        previousAmount,
        currentAmount,
        advanceDeduction: advanceDeduction || 0,
        retentionRate: retentionRate || 0,
        retentionAmount,
        stampTax: stampTax || 0,
        otherDeduction: otherDeduction || 0,
        netAmount,
        notes,
        items: {
          create: processedItems,
        },
      },
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        items: true,
      },
    });

    return NextResponse.json(hakedis, { status: 201 });
  } catch (error) {
    console.error("Hakediş oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
