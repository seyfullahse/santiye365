import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Versiyon kalemleri (hiyerarşik, tam liste veya sayfalı)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const { versionId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5000");
    const search = searchParams.get("search");
    const groupCode = searchParams.get("groupCode");

    const where: Record<string, unknown> = { versionId };
    if (search) {
      where.OR = [
        { pozCode: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { groupName: { contains: search, mode: "insensitive" } },
        { subGroupName: { contains: search, mode: "insensitive" } },
        { detail: { contains: search, mode: "insensitive" } },
      ];
    }
    if (groupCode) {
      where.groupCode = groupCode;
    }

    const [items, total, version, aggregates] = await Promise.all([
      prisma.tenderItem.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          discipline: { select: { id: true, code: true, name: true, color: true } },
        },
      }),
      prisma.tenderItem.count({ where }),
      prisma.tenderVersion.findUnique({
        where: { id: versionId },
        include: { tender: { select: { id: true, name: true, currency: true } } },
      }),
      prisma.tenderItem.aggregate({
        where: { versionId, level: 2 },
        _sum: {
          totalPrice: true,
          laborCost: true,
          materialCost: true,
          equipmentCost: true,
          importAmount: true,
          localAmount: true,
        },
        _count: true,
      }),
    ]);

    // Grup bazlı özet
    const groupSummary = await prisma.tenderItem.groupBy({
      by: ["groupCode"],
      where: { versionId, level: 0 },
      _count: true,
    });

    // Grup toplamları (level=2 kalemlerden)
    const groupTotals = await prisma.tenderItem.groupBy({
      by: ["groupCode"],
      where: { versionId, level: 2, groupCode: { not: null } },
      _sum: { totalPrice: true },
      _count: true,
    });

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      version,
      summary: {
        totalItems: aggregates._count,
        totalPrice: aggregates._sum.totalPrice || 0,
        totalLabor: aggregates._sum.laborCost || 0,
        totalMaterial: aggregates._sum.materialCost || 0,
        totalEquipment: aggregates._sum.equipmentCost || 0,
        totalImport: aggregates._sum.importAmount || 0,
        totalLocal: aggregates._sum.localAmount || 0,
      },
      groupTotals: groupTotals.map((gt: { groupCode: string | null; _sum: { totalPrice: number | null }; _count: number }) => ({
        code: gt.groupCode,
        total: gt._sum.totalPrice || 0,
        itemCount: gt._count,
      })),
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Kalemler yüklenemedi" }, { status: 500 });
  }
}

// POST - Toplu kalem ekleme (batch)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const { versionId } = await params;
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Kalem listesi zorunludur" }, { status: 400 });
    }

    const maxSort = await prisma.tenderItem.aggregate({
      where: { versionId },
      _max: { sortOrder: true },
    });
    let nextSort = (maxSort._max.sortOrder ?? 0) + 1;

    const chunkSize = 500;
    let inserted = 0;

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize).map((item: Record<string, unknown>, idx: number) => ({
        versionId,
        disciplineId: (item.disciplineId as string) || null,
        pozItemId: (item.pozItemId as string) || null,
        groupCode: (item.groupCode as string) || null,
        groupName: (item.groupName as string) || null,
        subGroupName: (item.subGroupName as string) || null,
        itemNumber: (item.itemNumber as string) || null,
        level: typeof item.level === "number" ? item.level : 2,
        pozCode: (item.pozCode as string) || null,
        description: (item.description as string) || "",
        detail: (item.detail as string) || null,
        contractorNote: (item.contractorNote as string) || null,
        unit: (item.unit as string) || "",
        quantity: parseFloat(String(item.quantity)) || 0,
        unitPrice: parseFloat(String(item.unitPrice)) || 0,
        totalPrice: (parseFloat(String(item.quantity)) || 0) * (parseFloat(String(item.unitPrice)) || 0),
        laborCost: parseFloat(String(item.laborCost)) || 0,
        materialCost: parseFloat(String(item.materialCost)) || 0,
        equipmentCost: parseFloat(String(item.equipmentCost)) || 0,
        importPercent: parseFloat(String(item.importPercent)) || 0,
        importAmount: parseFloat(String(item.importAmount)) || 0,
        localPercent: parseFloat(String(item.localPercent)) || 0,
        localAmount: parseFloat(String(item.localAmount)) || 0,
        sortOrder: nextSort + i + idx,
        notes: (item.notes as string) || null,
      }));

      await prisma.tenderItem.createMany({ data: chunk });
      inserted += chunk.length;
    }

    const totals = await prisma.tenderItem.aggregate({
      where: { versionId, level: 2 },
      _sum: { totalPrice: true },
    });
    await prisma.tenderVersion.update({
      where: { id: versionId },
      data: { totalCost: totals._sum.totalPrice || 0 },
    });

    return NextResponse.json({ inserted }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Kalemler eklenemedi";
    console.error("Kalem ekleme hatası:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
