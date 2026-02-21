import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const zoneId = req.nextUrl.searchParams.get("zoneId");
  try {
    const floors = await prisma.floor.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(zoneId ? { zoneId } : {}),
      },
      include: {
        project: { select: { name: true } },
        zone: { select: { name: true } },
        _count: { select: { activities: true } },
      },
      orderBy: { orderNo: "asc" },
    });
    return NextResponse.json(floors);
  } catch (error) {
    console.error("Katlar alınamadı:", error);
    return NextResponse.json({ error: "Katlar alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const floor = await prisma.floor.create({
      data: {
        projectId: body.projectId,
        zoneId: body.zoneId,
        name: body.name,
        orderNo: body.orderNo || 0,
      },
    });
    return NextResponse.json(floor, { status: 201 });
  } catch (error) {
    console.error("Kat oluşturulamadı:", error);
    return NextResponse.json({ error: "Kat oluşturulamadı" }, { status: 500 });
  }
}
