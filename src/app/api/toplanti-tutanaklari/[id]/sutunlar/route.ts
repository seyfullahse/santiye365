import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Sütun ekle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const body = await request.json();
    const { name, type = "text", width, options, isRequired = false } = body;

    if (!name) {
      return NextResponse.json({ error: "Sütun adı zorunludur" }, { status: 400 });
    }

    // Sıralama numarası
    const lastColumn = await prisma.meetingColumn.findFirst({
      where: { meetingId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder = (lastColumn?.sortOrder ?? 0) + 1;

    const column = await prisma.meetingColumn.create({
      data: {
        meetingId,
        name,
        type,
        sortOrder,
        width,
        options: options ? JSON.stringify(options) : null,
        isRequired,
      },
    });

    // Mevcut satırlar için boş değer oluştur
    const existingItems = await prisma.meetingItem.findMany({
      where: { meetingId },
      select: { id: true },
    });

    if (existingItems.length > 0) {
      await prisma.meetingItemValue.createMany({
        data: existingItems.map((item) => ({
          itemId: item.id,
          columnId: column.id,
          value: "",
        })),
      });
    }

    return NextResponse.json(column, { status: 201 });
  } catch (error) {
    console.error("Sütun ekleme hatası:", error);
    return NextResponse.json({ error: "Sütun eklenemedi" }, { status: 500 });
  }
}

// PUT - Sütun güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { columnId, name, type, width, options, isRequired, sortOrder } = body;

    if (!columnId) {
      return NextResponse.json({ error: "columnId zorunludur" }, { status: 400 });
    }

    const column = await prisma.meetingColumn.update({
      where: { id: columnId },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(width !== undefined && { width }),
        ...(options !== undefined && { options: JSON.stringify(options) }),
        ...(isRequired !== undefined && { isRequired }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json(column);
  } catch (error) {
    console.error("Sütun güncelleme hatası:", error);
    return NextResponse.json({ error: "Sütun güncellenemedi" }, { status: 500 });
  }
}

// DELETE - Sütun sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const columnId = searchParams.get("columnId");

    if (!columnId) {
      return NextResponse.json({ error: "columnId zorunludur" }, { status: 400 });
    }

    await prisma.meetingColumn.delete({ where: { id: columnId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sütun silme hatası:", error);
    return NextResponse.json({ error: "Sütun silinemedi" }, { status: 500 });
  }
}
