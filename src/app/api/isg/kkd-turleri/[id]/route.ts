import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await prisma.pPEType.update({
      where: { id },
      data: {
        name: body.name,
        category: body.category || null,
        validityDays: body.validityDays ? parseInt(body.validityDays) : null,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // İlişkili zimmet kaydı var mı kontrol et
    const count = await prisma.pPEAssignment.count({ where: { ppeTypeId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Bu KKD türüne ait ${count} zimmet kaydı var. Önce kayıtları silin.` },
        { status: 400 }
      );
    }

    await prisma.pPEType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}
