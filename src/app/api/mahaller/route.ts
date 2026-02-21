import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  try {
    const zones = await prisma.zone.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: { select: { name: true } },
        _count: { select: { floors: true, activities: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(zones);
  } catch (error) {
    console.error("Mahaller alınamadı:", error);
    return NextResponse.json({ error: "Mahaller alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const zone = await prisma.zone.create({
      data: {
        projectId: body.projectId,
        name: body.name,
        description: body.description || null,
      },
    });
    return NextResponse.json(zone, { status: 201 });
  } catch (error) {
    console.error("Mahal oluşturulamadı:", error);
    return NextResponse.json({ error: "Mahal oluşturulamadı" }, { status: 500 });
  }
}
