import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const floor = await prisma.floor.update({
      where: { id },
      data: {
        name: body.name,
        orderNo: body.orderNo,
      },
    });
    return NextResponse.json(floor);
  } catch (error) {
    console.error("Kat güncellenemedi:", error);
    return NextResponse.json({ error: "Kat güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const activityCount = await prisma.activity.count({ where: { floorId: id } });
    if (activityCount > 0) {
      return NextResponse.json(
        { error: `Bu kata bağlı ${activityCount} aktivite bulunmaktadır. Önce aktiviteleri silmelisiniz.` },
        { status: 400 }
      );
    }

    await prisma.floor.delete({ where: { id } });
    return NextResponse.json({ message: "Kat silindi" });
  } catch (error) {
    console.error("Kat silinemedi:", error);
    return NextResponse.json({ error: "Kat silinemedi" }, { status: 500 });
  }
}
