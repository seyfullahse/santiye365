import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const zone = await prisma.zone.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
      },
    });
    return NextResponse.json(zone);
  } catch (error) {
    console.error("Mahal güncellenemedi:", error);
    return NextResponse.json({ error: "Mahal güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const [floorCount, activityCount] = await Promise.all([
      prisma.floor.count({ where: { zoneId: id } }),
      prisma.activity.count({ where: { zoneId: id } }),
    ]);
    if (floorCount > 0) {
      return NextResponse.json(
        { error: `Bu mahale bağlı ${floorCount} kat bulunmaktadır. Önce katları silmelisiniz.` },
        { status: 400 }
      );
    }
    if (activityCount > 0) {
      return NextResponse.json(
        { error: `Bu mahale bağlı ${activityCount} aktivite bulunmaktadır. Önce aktiviteleri silmelisiniz.` },
        { status: 400 }
      );
    }

    await prisma.zone.delete({ where: { id } });
    return NextResponse.json({ message: "Mahal silindi" });
  } catch (error) {
    console.error("Mahal silinemedi:", error);
    return NextResponse.json({ error: "Mahal silinemedi" }, { status: 500 });
  }
}
