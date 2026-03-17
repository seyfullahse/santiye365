import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AnasayfaClient } from "./anasayfa-client";
import { PortalClient } from "./portal-client";

/* ─── Temel kullanıcı rolleri (portal sayfasını görecekler) ─── */
const BASIC_ROLES = ["USER", "VIEWER", "MUHASEBE"];

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/giris");

  const userRole = session.user?.role ?? "USER";
  const isBasicUser = BASIC_ROLES.includes(userRole);

  /* ═══ BASIC USERS → Portal ═══ */
  if (isBasicUser) {
    const userId = session.user?.id;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 1) Paralel: duyurular, bildirimler, employee + worker chain, indirimler
    const [announcements, notifications, userWithEmployee, discounts] = await Promise.all([
      // Son aktif duyurular
      prisma.announcement.findMany({
        where: {
          isActive: true,
          publishDate: { lte: new Date() },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        orderBy: [{ isPinned: "desc" }, { publishDate: "desc" }],
        take: 20,
        include: {
          category: { select: { name: true, color: true } },
          author: { select: { name: true } },
          reads: userId ? { where: { userId }, select: { id: true } } : false,
        },
      }),
      // Okunmamış bildirimler
      userId
        ? prisma.notification.findMany({
            where: { userId, isRead: false },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
        : [],
      // Employee + Worker chain (User → Employee → Worker)
      userId
        ? (prisma.user as any).findUnique({
            where: { id: userId },
            select: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  employeeNo: true,
                  phone: true,
                  email: true,
                  department: { select: { name: true } },
                  position: { select: { name: true } },
                  company: { select: { name: true } },
                  project: { select: { id: true, name: true, client: true, status: true } },
                },
              },
            },
          })
        : null,
      // Tüm aktif indirimler
      (prisma as any).employeeDiscount.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const employee = (userWithEmployee as any)?.employee ?? null;

    // 2) Worker + attendance + leave
    let worker: any = null;
    let monthlyAttendance: any[] = [];
    let todayAtt: any = null;
    let leaveRequests: any[] = [];

    if (employee) {
      // İzin taleplerini employee bazlı çek (leaveRequest tablosundan)
      const leavePromise = (prisma as any).leaveRequest.findMany({
        where: { employeeId: employee.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // Worker varsa puantaj verilerini çek
      worker = await (prisma as any).worker.findUnique({
        where: { employeeId: employee.id },
        select: { id: true },
      });

      if (worker) {
        const [attData, todayData, leavesData] = await Promise.all([
          (prisma as any).attendance.findMany({
            where: {
              workerId: worker.id,
              date: { gte: startOfMonth, lt: endOfMonth },
            },
            orderBy: { date: "asc" },
          }),
          (prisma as any).attendance.findFirst({
            where: {
              workerId: worker.id,
              date: { gte: startOfDay, lt: endOfDay },
            },
          }),
          leavePromise,
        ]);
        monthlyAttendance = attData ?? [];
        todayAtt = todayData;
        leaveRequests = leavesData ?? [];
      } else {
        // Worker yoksa bile izin taleplerini göster
        leaveRequests = (await leavePromise) ?? [];
      }
    }

    return (
      <PortalClient
        userName={session.user?.name ?? "Kullanıcı"}
        userEmail={session.user?.email ?? ""}
        userRole={userRole}
        employeeId={employee?.id ?? null}
        employee={employee ? {
          id: employee.id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          employeeNo: employee.employeeNo,
          phone: employee.phone,
          email: employee.email,
          department: employee.department?.name ?? null,
          position: employee.position?.name ?? null,
          company: employee.company?.name ?? null,
          project: employee.project?.name ?? null,
        } : null}
        todayAttendance={todayAtt ? {
          date: todayAtt.date.toISOString(),
          status: todayAtt.status,
          totalHours: todayAtt.totalHours ?? 0,
          overtime: todayAtt.overtime ?? 0,
          shift: todayAtt.shift ?? "DAY",
          note: todayAtt.note ?? null,
        } : null}
        monthlyAttendance={monthlyAttendance.map((a: any) => ({
          date: a.date.toISOString(),
          status: a.status,
          totalHours: a.totalHours ?? 0,
          overtime: a.overtime ?? 0,
          shift: a.shift ?? "DAY",
          note: a.note ?? null,
        }))}
        leaveRequests={leaveRequests.map((l: any) => ({
          id: l.id,
          type: l.type,
          startDate: l.startDate.toISOString(),
          endDate: l.endDate.toISOString(),
          totalDays: l.totalDays,
          reason: l.reason,
          status: l.status,
          createdAt: l.createdAt.toISOString(),
        }))}
        discounts={(discounts ?? []).map((d: any) => ({
          id: d.id,
          companyName: d.companyName,
          category: d.category,
          discountRate: d.discountRate,
          description: d.description,
          logo: d.logo,
          contactInfo: d.contactInfo,
          validUntil: d.validUntil?.toISOString() ?? null,
        }))}
        announcements={announcements.map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content.substring(0, 300),
          priority: a.priority,
          isPinned: a.isPinned,
          categoryName: a.category.name,
          categoryColor: a.category.color,
          authorName: a.author.name,
          publishDate: a.publishDate.toISOString(),
          isRead: a.reads && a.reads.length > 0,
        }))}
        notifications={notifications.map((n: any) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link,
          createdAt: n.createdAt.toISOString(),
        }))}
        projectInfo={employee?.project ? {
          id: employee.project.id,
          name: employee.project.name,
          client: employee.project.client ?? null,
          status: employee.project.status,
        } : null}
      />
    );
  }

  /* ═══ ADMIN / MANAGER / PROJECT_ADMIN → Full Dashboard ═══ */
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
      userRole={userRole}
      kpiData={{
        activeProjects,
        totalWorkers,
        todayAttendance,
        pendingApprovals,
      }}
      recentActivities={recentActivities.map((a: any) => ({
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
