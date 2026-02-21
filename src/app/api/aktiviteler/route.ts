import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const zoneId = req.nextUrl.searchParams.get("zoneId");
  const floorId = req.nextUrl.searchParams.get("floorId");
  const disciplineId = req.nextUrl.searchParams.get("disciplineId");
  try {
    const activities = await prisma.activity.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(zoneId ? { zoneId } : {}),
        ...(floorId ? { floorId } : {}),
        ...(disciplineId ? { disciplineId } : {}),
      },
      include: {
        project: { select: { name: true } },
        zone: { select: { name: true } },
        floor: { select: { name: true } },
        discipline: { select: { name: true } },
        _count: { select: { approvals: true, risks: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(activities);
  } catch (error) {
    console.error("Aktiviteler alınamadı:", error);
    return NextResponse.json({ error: "Aktiviteler alınamadı" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) {
      return NextResponse.json({ error: "Silinecek kayıt yok" }, { status: 400 });
    }
    const result = await prisma.activity.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Aktiviteler toplu silinemedi:", error);
    return NextResponse.json({ error: "Aktiviteler toplu silinemedi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const activity = await prisma.activity.create({
      data: {
        projectId: body.projectId,
        zoneId: body.zoneId,
        floorId: body.floorId,
        disciplineId: body.disciplineId,
        name: body.name,
        weight: body.weight || 0,
        progressPercent: body.progressPercent || 0,
        plannedStart: body.plannedStart ? new Date(body.plannedStart) : null,
        plannedFinish: body.plannedFinish ? new Date(body.plannedFinish) : null,
        forecastFinish: body.forecastFinish ? new Date(body.forecastFinish) : null,
        orderNo: body.orderNo ?? 0,
        actualFinish: body.actualFinish ? new Date(body.actualFinish) : null,
        isCritical: body.isCritical || false,
        status: body.status || "NOT_STARTED",
        notes: body.notes || null,
      },
    });
    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Aktivite oluşturulamadı:", error);
    return NextResponse.json({ error: "Aktivite oluşturulamadı" }, { status: 500 });
  }
}
