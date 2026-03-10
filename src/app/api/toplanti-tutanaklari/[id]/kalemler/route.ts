import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Satır ekle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const body = await request.json();
    const { values } = body; // { columnId: value, ... }

    // Sıra numarası hesapla
    const lastItem = await prisma.meetingItem.findFirst({
      where: { meetingId },
      orderBy: { rowNumber: "desc" },
      select: { rowNumber: true, sortOrder: true },
    });
    const rowNumber = (lastItem?.rowNumber ?? 0) + 1;
    const sortOrder = (lastItem?.sortOrder ?? 0) + 1;

    const item = await prisma.meetingItem.create({
      data: {
        meetingId,
        rowNumber,
        sortOrder,
        ...(values && Object.keys(values).length > 0
          ? {
              values: {
                create: Object.entries(values).map(([columnId, value]) => ({
                  columnId,
                  value: String(value),
                })),
              },
            }
          : {}),
      },
      include: {
        values: true,
        comments: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Satır ekleme hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Satır eklenemedi" },
      { status: 500 }
    );
  }
}

// PUT - Satır güncelle (hücre değerleri, tamamlanma durumu)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const body = await request.json();
    const { itemId, values, isCompleted } = body;

    if (!itemId) {
      return NextResponse.json({ error: "itemId zorunludur" }, { status: 400 });
    }

    // Tamamlanma durumu güncelle
    if (isCompleted !== undefined) {
      await prisma.meetingItem.update({
        where: { id: itemId },
        data: {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
      });
    }

    // Hücre değerlerini güncelle
    if (values && typeof values === "object") {
      for (const [columnId, value] of Object.entries(values)) {
        await prisma.meetingItemValue.upsert({
          where: { itemId_columnId: { itemId, columnId } },
          update: { value: String(value) },
          create: { itemId, columnId, value: String(value) },
        });
      }
    }

    // Güncel satırı döndür
    const item = await prisma.meetingItem.findUnique({
      where: { id: itemId },
      include: { values: true, comments: { orderBy: { createdAt: "desc" } } },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Satır güncelleme hatası:", error);
    return NextResponse.json({ error: "Satır güncellenemedi" }, { status: 500 });
  }
}

// DELETE - Satır sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "itemId zorunludur" }, { status: 400 });
    }

    await prisma.meetingItem.delete({ where: { id: itemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Satır silme hatası:", error);
    return NextResponse.json({ error: "Satır silinemedi" }, { status: 500 });
  }
}
