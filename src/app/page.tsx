import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AnasayfaClient } from "./anasayfa-client";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/giris");

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const [activeProjects, totalWorkers, pendingApprovals, todayAttendance, recentActivities] =
    await Promise.all([
      prisma.project.count({ where: { status: "ACTIVE" } }),
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      prisma.approval.count({ where: { status: "WAITING" } }),
      prisma.attendance.count({
        where: {
          date: { gte: startOfDay, lt: endOfDay },
          status: { in: ["PRESENT", "HALF_DAY"] },
        },
      }),
      prisma.activity.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: {
          project: { select: { name: true } },
          discipline: { select: { name: true } },
        },
      }),
    ]);

  return (
    <AnasayfaClient
      userName={session.user?.name ?? "Kullanıcı"}
      userEmail={session.user?.email ?? ""}
      userRole={session.user?.role ?? "USER"}
      kpiData={{
        activeProjects,
        totalWorkers,
        todayAttendance,
        pendingApprovals,
      }}
      recentActivities={recentActivities.map((a) => ({
        id: a.id,
        name: a.name,
        projectName: a.project.name,
        disciplineName: a.discipline.name,
        status: a.status,
        progressPercent: a.progressPercent,
        updatedAt: a.updatedAt.toISOString(),
      }))}
    />
  );
}
