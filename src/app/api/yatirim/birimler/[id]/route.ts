import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Birim güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const unit = await prisma.projectUnit.update({
      where: { id },
      data: {
        unitNo: body.unitNo,
        type: body.type,
        floor: body.floor !== undefined ? parseInt(body.floor) : undefined,
        grossArea: body.grossArea !== undefined ? parseFloat(body.grossArea) : undefined,
        netArea: body.netArea !== undefined ? parseFloat(body.netArea) : undefined,
        roomCount: body.roomCount,
        listPrice: body.listPrice !== undefined ? parseFloat(body.listPrice) : undefined,
        status: body.status,
        notes: body.notes,
      },
    });

    return NextResponse.json(unit);
  } catch (error) {
    console.error("Birim güncelleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE - Birim sil
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.projectUnit.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Birim silme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
