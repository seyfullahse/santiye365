import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Nakit akış kaydı güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const entry = await prisma.cashFlowEntry.update({
      where: { id },
      data: {
        type: body.type,
        category: body.category,
        description: body.description,
        amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
        entryDate: body.entryDate ? new Date(body.entryDate) : undefined,
        isProjection: body.isProjection,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Nakit akış güncelleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE - Nakit akış kaydı sil
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.cashFlowEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Nakit akış silme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
