import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Slayt sıralamasını güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { orders } = body; // [{ id, sortOrder }]

    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json({ error: "orders dizisi gerekli" }, { status: 400 });
    }

    for (const item of orders) {
      await prisma.presentationSlide.update({
        where: { id: parseInt(item.id) },
        data: { sortOrder: item.sortOrder },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sıralama güncelleme hatası:", error);
    return NextResponse.json({ error: "Sıralama güncellenemedi" }, { status: 500 });
  }
}
