import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Mesaj güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { text, icon, type, isActive } = body;

    const message = await prisma.sayacMessage.update({
      where: { id },
      data: {
        ...(text !== undefined && { text }),
        ...(icon !== undefined && { icon }),
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Mesaj güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Mesaj güncellenemedi" },
      { status: 500 }
    );
  }
}

// DELETE - Mesaj sil
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.sayacMessage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mesaj silme hatası:", error);
    return NextResponse.json(
      { error: "Mesaj silinemedi" },
      { status: 500 }
    );
  }
}
