import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
    }

    const [zones, floors, activities, pendingApprovals, openRisks, materials] =
      await Promise.all([
        prisma.zone.count({ where: { projectId: id } }),
        prisma.floor.count({ where: { zone: { projectId: id } } }),
        prisma.activity.findMany({
          where: { projectId: id },
          select: { weight: true, progressPercent: true, status: true },
        }),
        prisma.approval.count({
          where: { activity: { projectId: id }, status: "WAITING" },
        }),
        prisma.risk.count({ where: { projectId: id, status: "OPEN" } }),
        prisma.materialItem.count({ where: { projectId: id } }),
      ]);

    const totalProgress =
      activities.length > 0
        ? Math.round(
            (activities.reduce(
              (sum, a) => sum + a.weight * a.progressPercent,
              0
            ) /
              100) *
              10
          ) / 10
        : 0;

    const completedActivities = activities.filter(
      (a) => a.status === "COMPLETED"
    ).length;

    return NextResponse.json({
      zones,
      floors,
      activities: activities.length,
      completedActivities,
      pendingApprovals,
      openRisks,
      totalProgress,
      materials,
    });
  } catch (error) {
    console.error("Proje özeti alınamadı:", error);
    return NextResponse.json(
      { error: "Proje özeti alınamadı" },
      { status: 500 }
    );
  }
}
