import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { zones: true, activities: true } },
      },
    });

    // Her proje için ilerleme hesapla
    const projectsWithProgress = await Promise.all(
      projects.map(async (project) => {
        const activities = await prisma.activity.findMany({
          where: { projectId: project.id },
          select: { weight: true, progressPercent: true },
        });
        const totalProgress =
          activities.reduce((sum, a) => sum + a.weight * a.progressPercent, 0) / 100;

        return {
          ...project,
          totalProgress: Math.round(totalProgress * 10) / 10,
        };
      })
    );

    return NextResponse.json(projectsWithProgress);
  } catch (error) {
    console.error("Projeler alınamadı:", error);
    return NextResponse.json({ error: "Projeler alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const project = await prisma.project.create({
      data: {
        name: body.name,
        client: body.client || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: body.status || "ACTIVE",
      },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Proje oluşturulamadı:", error);
    return NextResponse.json({ error: "Proje oluşturulamadı" }, { status: 500 });
  }
}
