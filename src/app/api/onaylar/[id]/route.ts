import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const approval = await prisma.approval.update({
      where: { id },
      data: {
        title: body.title,
        waitingOn: body.waitingOn,
        waitingDays: body.waitingDays,
        impactType: body.impactType,
        note: body.note,
        status: body.status,
      },
    });
    return NextResponse.json(approval);
  } catch (error) {
    console.error("Onay güncellenemedi:", error);
    return NextResponse.json({ error: "Onay güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.approval.delete({ where: { id } });
    return NextResponse.json({ message: "Onay silindi" });
  } catch (error) {
    console.error("Onay silinemedi:", error);
    return NextResponse.json({ error: "Onay silinemedi" }, { status: 500 });
  }
}
