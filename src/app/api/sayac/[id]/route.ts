import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tekil sayaç
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const timer = await prisma.countdownTimer.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    if (!timer) {
      return NextResponse.json({ error: "Sayaç bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(timer);
  } catch (error) {
    console.error("Sayaç detay hatası:", error);
    return NextResponse.json({ error: "Sayaç yüklenemedi" }, { status: 500 });
  }
}

// PUT - Sayaç güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, targetDate, emoji, isActive } = body;

    const timer = await prisma.countdownTimer.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(targetDate !== undefined && { targetDate: new Date(targetDate) }),
        ...(emoji !== undefined && { emoji }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(timer);
  } catch (error) {
    console.error("Sayaç güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Sayaç güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Sayaç sil
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.countdownTimer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sayaç silme hatası:", error);
    return NextResponse.json({ error: "Sayaç silinemedi" }, { status: 500 });
  }
}
