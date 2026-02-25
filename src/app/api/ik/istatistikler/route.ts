import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalEmployees,
      activeEmployees,
      passiveEmployees,
      departmentCount,
      pendingLeaves,
      totalLeaveRequests,
      disciplineCount,
      performanceCount,
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: "ACTIVE" } }),
      prisma.employee.count({ where: { status: "PASSIVE" } }),
      prisma.department.count(),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.leaveRequest.count(),
      prisma.disciplineRecord.count(),
      prisma.performanceReview.count(),
    ]);

    // Departman bazlı dağılım
    const departmentDistribution = await prisma.department.findMany({
      select: { name: true, _count: { select: { employees: true } } },
      orderBy: { sortOrder: "asc" },
    });

    // Son 5 işe alım
    const recentHires = await prisma.employee.findMany({
      where: { hireDate: { not: null } },
      select: { id: true, firstName: true, lastName: true, hireDate: true, department: { select: { name: true } }, position: { select: { name: true } } },
      orderBy: { hireDate: "desc" },
      take: 5,
    });

    return NextResponse.json({
      totalEmployees,
      activeEmployees,
      passiveEmployees,
      onLeaveEmployees: totalEmployees - activeEmployees - passiveEmployees,
      departmentCount,
      pendingLeaves,
      totalLeaveRequests,
      disciplineCount,
      performanceCount,
      departmentDistribution: departmentDistribution.map((d) => ({ name: d.name, count: d._count.employees })),
      recentHires,
    });
  } catch (error) {
    console.error("GET /api/ik/istatistikler error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}
