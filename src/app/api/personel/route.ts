import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  try {
    const workforce = await prisma.workforceDaily.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(startDate && endDate
          ? {
              date: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {}),
      },
      include: {
        team: {
          include: {
            company: { select: { name: true } },
            discipline: { select: { name: true } },
          },
        },
        project: { select: { name: true } },
      },
      orderBy: [{ date: "desc" }, { teamId: "asc" }],
    });
    return NextResponse.json(workforce);
  } catch (error) {
    console.error("Personel verileri alınamadı:", error);
    return NextResponse.json({ error: "Personel verileri alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workforce = await prisma.workforceDaily.upsert({
      where: {
        projectId_date_teamId: {
          projectId: body.projectId,
          date: new Date(body.date),
          teamId: body.teamId,
        },
      },
      update: { workerCount: body.workerCount },
      create: {
        projectId: body.projectId,
        date: new Date(body.date),
        teamId: body.teamId,
        workerCount: body.workerCount,
      },
    });
    return NextResponse.json(workforce, { status: 201 });
  } catch (error) {
    console.error("Personel kaydı oluşturulamadı:", error);
    return NextResponse.json(
      { error: "Personel kaydı oluşturulamadı" },
      { status: 500 }
    );
  }
}
