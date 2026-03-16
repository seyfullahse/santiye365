import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Projeye atanabilecek personeli getir
// Ana firma (MAIN) → İK Employee tablosundan (henüz projede olmayan)
// Taşeron (SUBCONTRACTOR) → Worker tablosundan (mevcut davranış)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const search = req.nextUrl.searchParams.get("search") || "";
  const companyType = req.nextUrl.searchParams.get("companyType") || "";

  try {
    // ═══ ANA FİRMA: İK Employee tablosundan çek ═══
    if (companyType === "MAIN") {
      // Zaten projeye atanmış Worker'ların employeeId'lerini bul
      const assignedWorkers = await prisma.projectWorkerAssignment.findMany({
        where: { projectId, isActive: true },
        include: { worker: { select: { employeeId: true } } },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assignedEmployeeIds = assignedWorkers
        .map((a: any) => a.worker.employeeId)
        .filter(Boolean) as string[];

      // Team.projectId üzerinden zaten projede olan worker'ların employeeId'leri
      const teamLinkedWorkers = await prisma.worker.findMany({
        where: { isActive: true, team: { projectId }, employeeId: { not: null } },
        select: { employeeId: true },
      });
      const teamEmployeeIds = teamLinkedWorkers
        .map((w: { employeeId: string | null }) => w.employeeId)
        .filter(Boolean) as string[];

      const excludeEmployeeIds = [...new Set([...assignedEmployeeIds, ...teamEmployeeIds])];

      // Ana firma şirketlerinin ID'lerini al
      const mainCompanies = await prisma.company.findMany({
        where: { type: "MAIN" },
        select: { id: true },
      });
      const mainCompanyIds = mainCompanies.map((c: { id: string }) => c.id);

      // İK Employee tablosundan aktif personeli getir
      const employees = await prisma.employee.findMany({
        where: {
          status: "ACTIVE",
          companyId: { in: mainCompanyIds.length > 0 ? mainCompanyIds : ["_none_"] },
          ...(excludeEmployeeIds.length > 0 ? { id: { notIn: excludeEmployeeIds } } : {}),
          ...(search
            ? {
                OR: [
                  { firstName: { contains: search, mode: "insensitive" as const } },
                  { lastName: { contains: search, mode: "insensitive" as const } },
                  { tcNo: { contains: search, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
        include: {
          company: { select: { id: true, name: true, type: true } },
          department: { select: { name: true } },
          position: { select: { name: true } },
          team: { select: { id: true, name: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: 100,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = employees.map((e: any) => ({
        id: e.id,
        _isEmployee: true,
        firstName: e.firstName,
        lastName: e.lastName,
        role: e.position?.name || "Personel",
        position: e.position?.name || null,
        tcNo: e.tcNo || null,
        phone: e.phone || null,
        department: e.department?.name || null,
        team: {
          id: e.team?.id || "",
          name: e.team?.name || e.department?.name || "—",
          company: {
            id: e.company?.id || "",
            name: e.company?.name || "",
            type: e.company?.type || "MAIN",
          },
        },
      }));

      return NextResponse.json(result);
    }

    // ═══ TAŞERON: Mevcut Worker tablosundan çek ═══
    const assigned = await prisma.projectWorkerAssignment.findMany({
      where: { projectId, isActive: true },
      select: { workerId: true },
    });
    const assignedIds = assigned.map((a: { workerId: string }) => a.workerId);

    const teamWorkers = await prisma.worker.findMany({
      where: { isActive: true, team: { projectId } },
      select: { id: true },
    });
    const teamWorkerIds = teamWorkers.map((w: { id: string }) => w.id);

    const excludeIds = [...new Set([...assignedIds, ...teamWorkerIds])];

    const workers = await prisma.worker.findMany({
      where: {
        isActive: true,
        id: { notIn: excludeIds.length > 0 ? excludeIds : ["_none_"] },
        ...(companyType ? { team: { company: { type: companyType as "SUBCONTRACTOR" | "MANAGEMENT" } } } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" as const } },
                { lastName: { contains: search, mode: "insensitive" as const } },
                { role: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      include: {
        team: {
          include: {
            company: { select: { id: true, name: true, type: true } },
            discipline: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { team: { company: { name: "asc" } } },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
      take: 100,
    });

    return NextResponse.json(workers);
  } catch (error) {
    console.error("Atanmamış çalışanlar alınamadı:", error);
    return NextResponse.json({ error: "Çalışanlar yüklenemedi" }, { status: 500 });
  }
}
