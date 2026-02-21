import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        project: { select: { name: true } },
        zone: { select: { name: true } },
        floor: { select: { name: true } },
        discipline: { select: { name: true } },
        approvals: true,
        risks: true,
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!activity) {
      return NextResponse.json({ error: "Aktivite bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Aktivite alınamadı:", error);
    return NextResponse.json({ error: "Aktivite alınamadı" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const activity = await prisma.activity.update({
      where: { id },
      data: {
        projectId: body.projectId,
        zoneId: body.zoneId,
        floorId: body.floorId,
        disciplineId: body.disciplineId,
        name: body.name,
        weight: body.weight,
        orderNo: body.orderNo ?? 0,
        progressPercent: body.progressPercent,
        plannedStart: body.plannedStart ? new Date(body.plannedStart) : null,
        plannedFinish: body.plannedFinish ? new Date(body.plannedFinish) : null,
        forecastFinish: body.forecastFinish ? new Date(body.forecastFinish) : null,
        actualFinish: body.actualFinish ? new Date(body.actualFinish) : null,
        isCritical: body.isCritical,
        status: body.status,
        notes: body.notes,
      },
    });
    return NextResponse.json(activity);
  } catch (error) {
    console.error("Aktivite güncellenemedi:", error);
    return NextResponse.json({ error: "Aktivite güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.activity.delete({ where: { id } });
    return NextResponse.json({ message: "Aktivite silindi" });
  } catch (error) {
    console.error("Aktivite silinemedi:", error);
    return NextResponse.json({ error: "Aktivite silinemedi" }, { status: 500 });
  }
}
