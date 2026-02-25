import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const projectId = searchParams.get("projectId") || "";
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;

    const accidents = await prisma.workAccident.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        involvedEmployees: {
          include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } } },
        },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(accidents);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const accident = await prisma.workAccident.create({
      data: {
        projectId: body.projectId || null,
        date: new Date(body.date),
        time: body.time || null,
        location: body.location || null,
        description: body.description,
        severity: body.severity,
        lostDays: body.lostDays ? parseInt(body.lostDays) : 0,
        rootCause: body.rootCause || null,
        correctiveAction: body.correctiveAction || null,
        reportedToSGK: body.reportedToSGK || false,
        involvedEmployees: body.employeeIds?.length > 0 ? {
          create: body.employeeIds.map((eid: string) => ({ employeeId: eid })),
        } : undefined,
      },
      include: {
        project: { select: { id: true, name: true } },
        involvedEmployees: { include: { employee: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
    return NextResponse.json(accident, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
