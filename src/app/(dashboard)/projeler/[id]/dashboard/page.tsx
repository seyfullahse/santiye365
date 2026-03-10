import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/app/(dashboard)/dashboard/dashboard-client";

async function getProjectDashboardData(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) return null;

  // Aktiviteler
  const activities = await prisma.activity.findMany({
    where: { projectId: project.id },
    include: { discipline: true },
  });

  const totalProgress =
    activities.reduce((sum, a) => sum + a.weight * a.progressPercent, 0) / 100;

  const today = new Date();
  const plannedProgress = activities
    .filter((a) => a.plannedFinish && a.plannedFinish <= today)
    .reduce((sum, a) => sum + a.weight, 0);

  const deviation = totalProgress - plannedProgress;

  const criticalCount = activities.filter(
    (a) => a.isCritical && a.progressPercent < 100
  ).length;

  const pendingApprovals = await prisma.approval.count({
    where: { activity: { projectId: project.id }, status: "WAITING" },
  });

  const approvalList = await prisma.approval.findMany({
    where: { activity: { projectId: project.id }, status: "WAITING" },
    include: { activity: { select: { name: true } } },
    orderBy: { waitingDays: "desc" },
    take: 10,
  });

  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const workforce = await prisma.workforceDaily.findMany({
    where: {
      projectId: project.id,
      date: { gte: weekStart, lte: today },
    },
  });
  const todayWorkforce = await prisma.workforceDaily.aggregate({
    where: {
      projectId: project.id,
      date: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        lt: new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1
        ),
      },
    },
    _sum: { workerCount: true },
  });

  const topRisks = await prisma.risk.findMany({
    where: { projectId: project.id, status: "OPEN" },
    orderBy: { score: "desc" },
    take: 5,
    include: { activity: { select: { name: true } } },
  });

  const disciplineProgress = await prisma.discipline.findMany({
    include: {
      activities: {
        where: { projectId: project.id },
        select: { weight: true, progressPercent: true },
      },
    },
  });

  const disciplineData = disciplineProgress
    .filter((d) => d.activities.length > 0)
    .map((d) => {
      const totalWeight = d.activities.reduce((s, a) => s + a.weight, 0);
      const weightedProgress =
        totalWeight > 0
          ? d.activities.reduce(
              (s, a) => s + a.weight * a.progressPercent,
              0
            ) / totalWeight
          : 0;
      return { name: d.name, progress: Math.round(weightedProgress) };
    });

  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
  const lookahead = await prisma.activity.findMany({
    where: {
      projectId: project.id,
      plannedFinish: { gte: today, lte: twoWeeksLater },
      status: { not: "COMPLETED" },
    },
    include: { discipline: true, zone: true, floor: true },
    orderBy: [{ isCritical: "desc" }, { plannedFinish: "asc" }],
  });

  const criticalActivities = await prisma.activity.findMany({
    where: {
      projectId: project.id,
      isCritical: true,
      status: { not: "COMPLETED" },
    },
    include: { discipline: true, zone: true, floor: true },
    orderBy: [{ plannedFinish: "asc" }],
  });

  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const workforceTrend = await prisma.workforceDaily.groupBy({
    by: ["date"],
    where: { projectId: project.id, date: { gte: twoWeeksAgo } },
    _sum: { workerCount: true },
    orderBy: { date: "asc" },
  });

  const workforceTrendData = workforceTrend.map((w) => ({
    date: w.date.toISOString().split("T")[0],
    count: w._sum.workerCount ?? 0,
  }));

  // Dashboard'daki proje dropdown'u için tüm projeler
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, status: true },
  });

  return {
    project: {
      id: project.id,
      name: project.name,
      client: project.client,
      startDate: project.startDate?.toISOString() ?? null,
      endDate: project.endDate?.toISOString() ?? null,
      status: project.status,
    },
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
    })),
    totalProgress: Math.round(totalProgress * 10) / 10,
    plannedProgress: Math.round(plannedProgress * 10) / 10,
    deviation: Math.round(deviation * 10) / 10,
    criticalCount,
    pendingApprovals,
    todayWorkforce: todayWorkforce._sum.workerCount ?? 0,
    topRisks: topRisks.map((r) => ({
      id: r.id,
      title: r.title,
      impact: r.impact,
      probability: r.probability,
      score: r.score,
      responsible: r.responsible,
      activityName: r.activity?.name ?? null,
    })),
    approvalList: approvalList.map((a) => ({
      id: a.id,
      title: a.title,
      waitingOn: a.waitingOn,
      waitingDays: a.waitingDays,
      impactType: a.impactType,
      activityName: a.activity.name,
    })),
    disciplineData,
    lookahead: lookahead.map((a) => ({
      id: a.id,
      name: a.name,
      discipline: a.discipline.name,
      zone: a.zone.name,
      floor: a.floor.name,
      plannedFinish: a.plannedFinish?.toISOString() ?? null,
      progressPercent: a.progressPercent,
      isCritical: a.isCritical,
    })),
    criticalActivities: criticalActivities.map((a) => ({
      id: a.id,
      name: a.name,
      discipline: a.discipline.name,
      zone: a.zone.name,
      floor: a.floor.name,
      weight: a.weight,
      progressPercent: a.progressPercent,
      plannedStart: a.plannedStart?.toISOString() ?? null,
      plannedFinish: a.plannedFinish?.toISOString() ?? null,
      status: a.status,
    })),
    workforceTrend: workforceTrendData,
    puantaj: {
      activeWorkers: 0,
      totalWorkers: 0,
      todayPresent: 0,
      todayAbsent: 0,
      todayLeave: 0,
      monthTotalHours: 0,
      monthOvertime: 0,
      pendingLeaves: 0,
      trend: [],
    },
  };
}

export default async function ProjectDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getProjectDashboardData(id);

  if (!data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">
          Proje verisi bulunamadı.
        </p>
      </div>
    );
  }

  return <DashboardClient data={data} />;
}
