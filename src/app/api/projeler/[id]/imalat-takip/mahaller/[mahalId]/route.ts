import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT — Mahal güncelle (ad, sıra)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; mahalId: string }> }
) {
  const { mahalId } = await params;
  try {
    const body = await req.json();
    const mahal = await prisma.imalatMahal.update({
      where: { id: mahalId },
      data: {
        name: body.name,
        sortOrder: body.sortOrder,
      },
    });
    return NextResponse.json(mahal);
  } catch (error) {
    console.error("İmalat mahali güncellenemedi:", error);
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}

// DELETE — Mahal ve tüm kalemleri sil
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; mahalId: string }> }
) {
  const { mahalId } = await params;
  try {
    await prisma.imalatMahal.delete({ where: { id: mahalId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("İmalat mahali silinemedi:", error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
